-- ============================================================
-- 19 · Velocidad por franja (ADM-15), tiempo estimado con historial (CIU-09)
--      y retención de 90 días (SIS-06, brecha TS-02)
--
-- ADR-0011 y ADR-0013. Tres piezas que dependen una de otra:
--
--   1. Cada viaje terminado deja su velocidad efectiva en `velocidades_de_viaje`:
--      distancia recorrida ÷ duración, con las paradas y los semáforos adentro,
--      porque eso es lo que tarda la unidad en llegar.
--   2. Con esas velocidades, `velocidad_historica_kmh` da la mediana de la ruta en
--      la franja actual —la hora en Caracas y si es día hábil o fin de semana—
--      cuando hay al menos `eta_historico_min_viajes` viajes. Si no, nula: el
--      tiempo estimado se queda con el cálculo simple. `llegadas_a_parada` la
--      entrega a la web, y la mezcla la decide el dominio (domain/eta.ts).
--   3. Las posiciones crudas de más de `retencion_posiciones_dias` se borran,
--      siempre después de que su viaje dejó su velocidad. La tabla de velocidades
--      no se borra: es lo que sobrevive a la retención.
--
-- Un job nocturno (pg_cron) corre 1 y 3, en ese orden y en la misma llamada.
--
-- Por qué una fila por viaje y no la mediana guardada por franja (como sugería
-- ADR-0011): una mediana no se puede actualizar sumando un viaje nuevo, habría que
-- recalcularla con todos los anteriores, y esos son justo los que la retención
-- borra. Las velocidades por viaje pesan poco y la mediana sale de ellas al vuelo.
--
-- Corre después de 18. Es idempotente: se puede volver a aplicar.
-- El drop de `llegadas_a_parada` es necesario: cambia su tipo de retorno.
-- ============================================================


-- ── PARÁMETROS ──
insert into parametros (clave, valor, descripcion) values
  ('eta_historico_min_viajes', 5,
   'Viajes de la misma ruta y franja necesarios para usar la velocidad historica en el tiempo estimado'),
  ('retencion_posiciones_dias', 90,
   'Dias que se conservan las posiciones crudas antes de borrarlas')
on conflict (clave) do nothing;


-- ── FRANJA HORARIA ──
--
-- La hora es la de Caracas, no la del servidor (UTC): «a las 7 a. m. la ruta va
-- más lenta» se refiere a las 7 de la ciudad. Los históricos ya cuentan así
-- (16_historicos_periodo_y_cobertura.sql).
create or replace function tipo_dia_de(momento timestamptz)
returns text
language sql
stable
set search_path = public
as $$
  select case
    when extract(isodow from momento at time zone 'America/Caracas') >= 6 then 'fin_de_semana'
    else 'habil'
  end;
$$;

create or replace function hora_de(momento timestamptz)
returns smallint
language sql
stable
set search_path = public
as $$
  select extract(hour from momento at time zone 'America/Caracas')::smallint;
$$;


-- ── VELOCIDAD DE CADA VIAJE ──
--
-- `velocidad_kmh` nula significa que el viaje se revisó y no sirve para el
-- historial (muy corto, pocas lecturas o una velocidad imposible). Se guarda
-- igual para no volver a revisarlo cada noche.
--
-- La franja es la del inicio del viaje: un recorrido que sale a las 7:50 cuenta
-- en la hora de las 7. Simple de explicar, y la diferencia se diluye en la mediana.
--
-- Borrar el viaje —al eliminar su unidad— borra su velocidad: lo mismo que pasa
-- con el resto de sus históricos.
create table if not exists velocidades_de_viaje (
  viaje_id      uuid primary key references viajes(id) on delete cascade,
  ruta_id       uuid not null references rutas(id) on delete cascade,
  tipo_dia      text not null check (tipo_dia in ('habil', 'fin_de_semana')),
  hora          smallint not null check (hora between 0 and 23),
  velocidad_kmh numeric,
  distancia_m   numeric,
  duracion_s    integer,
  calculado_at  timestamptz not null default now()
);

create index if not exists velocidades_de_viaje_franja_idx
  on velocidades_de_viaje (ruta_id, tipo_dia, hora);

-- La retención filtra por fecha de captura; sin índice recorrería la tabla de
-- mayor escritura completa cada noche.
create index if not exists posiciones_capturado_idx on posiciones (capturado_at);

-- Solo lectura para el panel. La escribe el job, que corre como `postgres` y no
-- pasa por RLS; el público no la lee: le llega solo la mediana, por función.
alter table velocidades_de_viaje enable row level security;

drop policy if exists admin_lee_velocidades on velocidades_de_viaje;
create policy admin_lee_velocidades on velocidades_de_viaje
  for select using (es_admin());

drop policy if exists operador_lee_velocidades on velocidades_de_viaje;
create policy operador_lee_velocidades on velocidades_de_viaje
  for select using (es_operador());


-- ── AGREGAR ──
--
-- Distancia: suma de los tramos entre posiciones usables consecutivas. No se mide
-- sobre el trazado porque en una ruta circular el inicio y el fin coinciden y el
-- avance daría casi cero.
--
-- Los umbrales no son calibrables: separan un viaje real de una prueba de
-- segundos o de un salto del GPS, no ajustan el comportamiento del sistema.
create or replace function agregar_velocidades_de_viajes()
returns integer
language plpgsql
volatile
set search_path = public
as $$
declare
  -- Menos que esto es una prueba o un viaje abierto y cerrado por error.
  minimo_posiciones constant integer := 10;
  minimo_duracion_s constant integer := 300;
  minimo_distancia_m constant integer := 500;
  -- Un bus urbano no promedia esto en un recorrido entero: es un salto del GPS.
  maximo_velocidad_kmh constant integer := 90;
  agregados integer;
begin
  with pendientes as (
    select v.id, v.ruta_id, v.iniciado_at
    from viajes v
    where v.finalizado_at is not null
      and not exists (select 1 from velocidades_de_viaje w where w.viaje_id = v.id)
  ),
  tramos as (
    select
      p.viaje_id,
      p.capturado_at,
      ST_Distance(
        lag(p.ubicacion) over (partition by p.viaje_id order by p.capturado_at),
        p.ubicacion
      ) as tramo_m
    from posiciones p
    join pendientes pe on pe.id = p.viaje_id
    where p.usable
  ),
  medidas as (
    select
      viaje_id,
      count(*) as lecturas,
      coalesce(sum(tramo_m), 0) as distancia_m,
      extract(epoch from max(capturado_at) - min(capturado_at))::integer as duracion_s
    from tramos
    group by viaje_id
  )
  insert into velocidades_de_viaje (viaje_id, ruta_id, tipo_dia, hora, velocidad_kmh, distancia_m, duracion_s)
  select
    pe.id,
    pe.ruta_id,
    tipo_dia_de(pe.iniciado_at),
    hora_de(pe.iniciado_at),
    -- SQL no garantiza el orden de las condiciones: el nullif evita la división
    -- por cero aunque se evalúe antes que el umbral de duración.
    case
      when m.lecturas >= minimo_posiciones
       and m.duracion_s >= minimo_duracion_s
       and m.distancia_m >= minimo_distancia_m
       and m.distancia_m / nullif(m.duracion_s, 0) * 3.6 <= maximo_velocidad_kmh
      then round((m.distancia_m / nullif(m.duracion_s, 0) * 3.6)::numeric, 1)
    end,
    m.distancia_m,
    m.duracion_s
  from pendientes pe
  left join medidas m on m.viaje_id = pe.id
  on conflict (viaje_id) do nothing;

  get diagnostics agregados = row_count;
  return agregados;
end;
$$;


-- ── RETENCIÓN ──
--
-- Solo borra posiciones sin viaje o de un viaje que ya dejó su velocidad. Las de
-- un viaje abierto se quedan hasta que cierre y se agregue.
--
-- El piso de 30 días protege de un `update` equivocado en `parametros`: ADR-0013
-- descartó 30 por insuficiente, y menos que eso borraría el historial que necesita
-- el tiempo estimado. Este parámetro no está en la pantalla de Parámetros por lo
-- mismo: un error ahí borra datos que no vuelven.
create or replace function depurar_posiciones_antiguas()
returns integer
language plpgsql
volatile
set search_path = public
as $$
declare
  retencion_minima_dias constant integer := 30;
  dias integer;
  borradas integer;
begin
  select greatest(coalesce(max(valor), 90)::integer, retencion_minima_dias)
    into dias
    from parametros
   where clave = 'retencion_posiciones_dias';

  delete from posiciones p
   where p.capturado_at < now() - make_interval(days => dias)
     and (
       p.viaje_id is null
       or exists (select 1 from velocidades_de_viaje w where w.viaje_id = p.viaje_id)
     );

  get diagnostics borradas = row_count;
  return borradas;
end;
$$;


-- ── JOB NOCTURNO ──
--
-- Agregar antes de borrar, en la misma llamada: si el agregado falla, la excepción
-- corta la función y no se borra nada.
create or replace function mantenimiento_nocturno()
returns void
language plpgsql
volatile
set search_path = public
as $$
declare
  agregados integer;
  borradas integer;
begin
  agregados := agregar_velocidades_de_viajes();
  borradas := depurar_posiciones_antiguas();
  raise log '[ecoruta] mantenimiento_nocturno: % viajes agregados, % posiciones borradas', agregados, borradas;
end;
$$;

-- Escriben y borran: nadie fuera del job las llama. Sin esto quedarían expuestas
-- como RPC de PostgREST.
revoke execute on function agregar_velocidades_de_viajes() from public, anon, authenticated;
revoke execute on function depurar_posiciones_antiguas() from public, anon, authenticated;
revoke execute on function mantenimiento_nocturno() from public, anon, authenticated;

create extension if not exists pg_cron with schema pg_catalog;

-- 07:30 UTC son las 3:30 en Caracas: sin unidades en la calle. Programarlo con el
-- mismo nombre reemplaza el job anterior, así que este archivo se puede repetir.
select cron.schedule(
  'ecoruta-mantenimiento-nocturno',
  '30 7 * * *',
  'select public.mantenimiento_nocturno()'
);


-- ── VELOCIDAD HISTÓRICA ──
--
-- security definer porque el público no lee `velocidades_de_viaje`: recibe una
-- sola cifra agregada por ruta y franja, nunca los viajes que la forman (ver
-- docs/05-trust-safety/politica-de-exposicion.md).
create or replace function velocidad_historica_kmh(ruta uuid, momento timestamptz default now())
returns double precision
language sql
stable
security definer
set search_path = public
as $$
  select case
    when count(*) >= coalesce(
      (select valor from parametros where clave = 'eta_historico_min_viajes'), 5
    )
    then percentile_cont(0.5) within group (order by w.velocidad_kmh::double precision)
  end
  from velocidades_de_viaje w
  where w.ruta_id = velocidad_historica_kmh.ruta
    and w.velocidad_kmh is not null
    and w.tipo_dia = tipo_dia_de(velocidad_historica_kmh.momento)
    and w.hora = hora_de(velocidad_historica_kmh.momento);
$$;

grant execute on function velocidad_historica_kmh(uuid, timestamptz) to anon, authenticated;


-- ── PANEL: VELOCIDADES POR FRANJA ──
--
-- Invoker: RLS deja leer al admin y al operador; cualquier otro recibe cero filas.
-- `viajes` cuenta solo los que tienen velocidad: es el número que se compara con
-- `eta_historico_min_viajes`.
create or replace function velocidades_por_franja()
returns table (
  ruta_id     uuid,
  tipo_dia    text,
  hora        smallint,
  mediana_kmh double precision,
  viajes      integer
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    w.ruta_id,
    w.tipo_dia,
    w.hora,
    percentile_cont(0.5) within group (order by w.velocidad_kmh::double precision),
    count(*)::integer
  from velocidades_de_viaje w
  where w.velocidad_kmh is not null
  group by w.ruta_id, w.tipo_dia, w.hora
  order by w.ruta_id, w.tipo_dia, w.hora;
$$;

grant execute on function velocidades_por_franja() to authenticated;


-- ── LLEGADAS A UNA PARADA ──
--
-- Igual que en 14_tiempo_estimado.sql, más `velocidad_historica_kmh`: la mediana
-- de la ruta en la franja de ahora, o nula si no hay viajes suficientes.
drop function if exists llegadas_a_parada(uuid);

create function llegadas_a_parada(parada uuid)
returns table (
  unidad_id               uuid,
  unidad_nombre           text,
  unidad_lat              double precision,
  unidad_lng              double precision,
  viaje_id                uuid,
  segundos_sin_senal      integer,
  distancia_recta_m       double precision,
  distancia_trazado_m     double precision,
  ya_paso                 boolean,
  velocidades_kmh         double precision[],
  incidencia_activa       boolean,
  ultima_parada           text,
  ruta_id                 uuid,
  ruta_nombre             text,
  ruta_color              text,
  ruta_icono              text,
  ruta_tiene_trazado      boolean,
  velocidad_historica_kmh double precision
)
language sql
stable
security invoker
set search_path = public
as $$
  with objetivo as (
    select p.id, p.ubicacion
    from paradas p
    where p.id = parada
  ),
  tolerancia as (
    select coalesce(
      (select valor from parametros where clave = 'distancia_parada_trazado_m'),
      40
    )::double precision as m
  )
  select
    u.id,
    u.nombre,
    ST_Y(pos.ubicacion::geometry),
    ST_X(pos.ubicacion::geometry),
    v.id,
    case
      when pos.capturado_at is null then null
      else extract(epoch from (now() - pos.capturado_at))::integer
    end,
    case
      when pos.ubicacion is null then null
      else ST_Distance(pos.ubicacion, o.ubicacion)
    end,
    tr.distancia_m,
    coalesce(tr.ya_paso, false),
    vel.velocidades,
    exists (
      select 1 from incidencias i
      where i.ruta_id = r.id and i.activa
    ),
    ult.nombre,
    r.id,
    r.nombre,
    r.color,
    r.icono,
    r.trazado is not null,
    velocidad_historica_kmh(r.id)
  from objetivo o
  cross join tolerancia t
  join paradas_por_ruta pr on pr.parada_id = o.id
  join rutas r on r.id = pr.ruta_id and r.activa
  join unidades u on u.ruta_id = r.id and u.activa
  left join viajes v on v.unidad_id = u.id and v.finalizado_at is null
  left join lateral (
    select p2.ubicacion, p2.capturado_at
    from posiciones p2
    where p2.unidad_id = u.id and p2.usable
    order by p2.capturado_at desc
    limit 1
  ) pos on true
  left join lateral (
    select array_agg(rec.velocidad_kmh::double precision order by rec.capturado_at desc)
             as velocidades
    from (
      select p4.velocidad_kmh, p4.capturado_at
      from posiciones p4
      where p4.viaje_id = v.id and p4.usable
      order by p4.capturado_at desc
      limit 5
    ) rec
  ) vel on v.id is not null
  left join lateral (
    select
      case
        when x.fu <= x.fp then
          ST_Length(ST_LineSubstring(x.linea, x.fu, x.fp)::geography)
        when x.circular then
          ST_Length(ST_LineSubstring(x.linea, x.fu, 1)::geography)
            + ST_Length(ST_LineSubstring(x.linea, 0, x.fp)::geography)
        when ST_Length(ST_LineSubstring(x.linea, x.fp, x.fu)::geography) < t.m then 0
        else null
      end as distancia_m,
      x.fu > x.fp
        and not x.circular
        and ST_Length(ST_LineSubstring(x.linea, x.fp, x.fu)::geography) >= t.m
        as ya_paso
    from (
      select
        r.trazado::geometry as linea,
        ST_LineLocatePoint(r.trazado::geometry, pos.ubicacion::geometry) as fu,
        ST_LineLocatePoint(r.trazado::geometry, o.ubicacion::geometry) as fp,
        ST_Distance(
          ST_StartPoint(r.trazado::geometry)::geography,
          ST_EndPoint(r.trazado::geometry)::geography
        ) < t.m as circular
    ) x
  ) tr on r.trazado is not null and pos.ubicacion is not null
  left join lateral (
    select p3.nombre
    from eventos_geocerca e
    join paradas p3 on p3.id = e.parada_id
    where e.viaje_id = v.id
    order by e.entro_at desc
    limit 1
  ) ult on true
  order by v.id is null, pos.capturado_at desc nulls last;
$$;

grant execute on function llegadas_a_parada(uuid) to anon, authenticated;
