-- ============================================================
-- 21 · Letreros: el nombre que muestra la unidad (decisión de la autora,
--      2026-11-20; contrato con la app en docs/contrato-vinculacion.md)
--
-- En San Juan de los Morros el cartel del parabrisas cambia según adónde mandan
-- la unidad: «Terminal – Villa Olímpica». El letrero lleva eso al sistema.
--
--   · El admin arma un catálogo (`letreros`) y decide qué opciones tiene cada
--     unidad (`unidad_letreros`).
--   · El conductor elige una desde la app (`cambiar_letrero`), en espera o en
--     pleno recorrido. Al finalizar el recorrido vuelve al nombre normal.
--   · La web lo muestra junto al nombre de la ruta, nunca en su lugar.
--
-- Es SOLO un nombre: trazado, paradas, geocercas y tiempo estimado siguen
-- saliendo de la ruta de la unidad (`unidades.ruta_id`).
--
-- Va en la unidad y no en el viaje porque también se elige en espera, antes de
-- abrir el recorrido. Como lo elige de una lista del admin, no hay texto libre
-- que llegue al público.
--
-- Corre después de 20. Es idempotente: se puede volver a aplicar.
-- Los drop son necesarios: las tres funciones de lectura cambian su retorno.
-- ============================================================


-- ── CATÁLOGO Y ASIGNACIÓN ──
create table if not exists letreros (
  id        uuid primary key default gen_random_uuid(),
  nombre    text not null check (char_length(btrim(nombre)) between 1 and 60),
  activo    boolean not null default true,
  -- Orden en el selector de la app: el admin pone primero las más usadas.
  orden     integer not null default 0,
  creado_at timestamptz not null default now()
);

-- Dos «Terminal – Villa Olímpica» que solo difieren en mayúsculas confundirían al
-- conductor en el selector.
create unique index if not exists letreros_nombre_idx on letreros (lower(btrim(nombre)));

create table if not exists unidad_letreros (
  unidad_id  uuid not null references unidades(id) on delete cascade,
  letrero_id uuid not null references letreros(id) on delete cascade,
  primary key (unidad_id, letrero_id)
);

create index if not exists unidad_letreros_letrero_idx on unidad_letreros (letrero_id);

-- La elección vigente. `letrero_desde` es cuándo se eligió: decide si un cierre de
-- recorrido que llega tarde puede limpiarla (ver el trigger más abajo).
alter table unidades add column if not exists letrero_id uuid references letreros(id) on delete set null;
alter table unidades add column if not exists letrero_desde timestamptz;


-- ── RLS ──
--
-- Solo el admin escribe; el operador mira. El público y el teléfono no leen estas
-- tablas: les llega el nombre vigente por función, y nada más.
alter table letreros enable row level security;
alter table unidad_letreros enable row level security;

drop policy if exists admin_total_letreros on letreros;
create policy admin_total_letreros on letreros
  for all using (es_admin()) with check (es_admin());

drop policy if exists operador_lee_letreros on letreros;
create policy operador_lee_letreros on letreros
  for select using (es_operador());

drop policy if exists admin_total_unidad_letreros on unidad_letreros;
create policy admin_total_unidad_letreros on unidad_letreros
  for all using (es_admin()) with check (es_admin());

drop policy if exists operador_lee_unidad_letreros on unidad_letreros;
create policy operador_lee_unidad_letreros on unidad_letreros
  for select using (es_operador());


-- ── LETRERO VIGENTE ──
--
-- La única regla de qué letrero se muestra: el elegido, solo si sigue activo y
-- asignado a esa unidad. Desactivar una opción o quitársela a la unidad no exige
-- limpiar nada: deja de ser vigente al leer, y la unidad vuelve al nombre normal
-- en la app y en la web a la vez. Una regla, ningún trigger que pueda fallar.
--
-- security definer: el público y el teléfono no leen `letreros`, pero sí deben ver
-- el nombre vigente (es un nombre que escribió el admin, como el de la ruta).
create or replace function letrero_vigente(unidad uuid)
returns table (id uuid, nombre text)
language sql
stable
security definer
set search_path = public
as $$
  select l.id, l.nombre
  from unidades u
  join letreros l on l.id = u.letrero_id and l.activo
  join unidad_letreros ul on ul.unidad_id = u.id and ul.letrero_id = l.id
  where u.id = letrero_vigente.unidad;
$$;

grant execute on function letrero_vigente(uuid) to anon, authenticated;


-- ── DESDE LA APP ──
--
-- La unidad sale del JWT, nunca de un parámetro. Si el teléfono ya no está
-- vinculado (sin fila en `dispositivos`), 401 como el latido: la app ya sabe qué
-- hacer con eso.
--
-- security definer: el teléfono no tiene política de UPDATE sobre `unidades`, y así
-- debe seguir. Solo puede cambiar estas dos columnas, y solo por aquí.
create or replace function exigir_dispositivo_vinculado()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  unidad uuid := unidad_del_dispositivo();
begin
  if unidad is null or not exists (select 1 from dispositivos d where d.unidad_id = unidad) then
    raise sqlstate 'PGRST' using
      message = '{"code":"dispositivo_revocado","message":"Este teléfono ya no está vinculado a la unidad."}',
      detail  = '{"status":401,"headers":{}}';
  end if;

  return unidad;
end;
$$;

revoke execute on function exigir_dispositivo_vinculado() from public, anon, authenticated;

create or replace function letreros_disponibles()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  unidad uuid := exigir_dispositivo_vinculado();
begin
  return jsonb_build_object(
    'actual', (select jsonb_build_object('id', lv.id, 'nombre', lv.nombre) from letrero_vigente(unidad) lv),
    'opciones', coalesce((
      select jsonb_agg(jsonb_build_object('id', l.id, 'nombre', l.nombre) order by l.orden, l.nombre)
      from unidad_letreros ul
      join letreros l on l.id = ul.letrero_id and l.activo
      where ul.unidad_id = unidad
    ), '[]'::jsonb)
  );
end;
$$;

revoke execute on function letreros_disponibles() from public, anon;
grant execute on function letreros_disponibles() to authenticated;

-- `letrero_desde` se renueva en CADA llamada, también si repite la opción: si el
-- conductor finaliza sin red y vuelve a elegir la misma para el siguiente
-- recorrido, el cierre atrasado no debe borrársela (ver el trigger).
create or replace function cambiar_letrero(p_letrero_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  unidad uuid := exigir_dispositivo_vinculado();
begin
  if p_letrero_id is not null and not exists (
    select 1
    from unidad_letreros ul
    join letreros l on l.id = ul.letrero_id and l.activo
    where ul.unidad_id = unidad and ul.letrero_id = p_letrero_id
  ) then
    raise sqlstate 'PGRST' using
      message = '{"code":"letrero_no_permitido","message":"Esa opción ya no está disponible para esta unidad."}',
      detail  = '{"status":400,"headers":{}}';
  end if;

  update unidades u
     set letrero_id = p_letrero_id,
         letrero_desde = now()
   where u.id = unidad;

  return jsonb_build_object(
    'actual', (select jsonb_build_object('id', lv.id, 'nombre', lv.nombre) from letrero_vigente(unidad) lv)
  );
end;
$$;

revoke execute on function cambiar_letrero(uuid) from public, anon;
grant execute on function cambiar_letrero(uuid) to authenticated;


-- ── VUELTA AL NOMBRE NORMAL AL CERRAR EL RECORRIDO ──
--
-- La app cierra recorridos sin red: el cierre puede llegar tarde, con un
-- `finalizado_at` en el pasado. Si en ese rato el conductor ya eligió otro
-- letrero en espera, ese es posterior al cierre y se respeta. Por eso la condición
-- compara contra `finalizado_at` y no contra now().
--
-- También corre al insertar un viaje ya finalizado, por si la app sube un
-- recorrido completo de una vez.
--
-- security definer: quien cierra el viaje es el teléfono, sin permiso sobre
-- `unidades`.
create or replace function volver_al_nombre_normal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update unidades u
     set letrero_id = null,
         letrero_desde = null
   where u.id = new.unidad_id
     and u.letrero_desde <= new.finalizado_at;

  return null;
end;
$$;

drop trigger if exists viajes_vuelve_al_nombre_normal on viajes;
create trigger viajes_vuelve_al_nombre_normal
  after insert or update of finalizado_at on viajes
  for each row
  when (new.finalizado_at is not null)
  execute function volver_al_nombre_normal();


-- ── TIEMPO REAL ──
--
-- El monitoreo escucha `unidades` como señal para volver a pedir `estado_flota`
-- (mismo patrón que 12_realtime_monitoreo.sql). RLS limita qué fila le llega a
-- cada suscriptor.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'unidades'
  ) then
    alter publication supabase_realtime add table unidades;
  end if;
end
$$;


-- ── MONITOREO ──
--
-- Igual que en 04_funciones.sql, más el letrero vigente.
drop function if exists estado_flota();

create function estado_flota()
returns table (
  unidad_id             uuid,
  unidad_nombre         text,
  unidad_lat            double precision,
  unidad_lng            double precision,
  ruta_id               uuid,
  ruta_nombre           text,
  ruta_color            text,
  ruta_icono            text,
  viaje_id              uuid,
  en_recorrido          boolean,
  velocidad_kmh         numeric,
  capturado_at          timestamptz,
  segundos_sin_senal    integer,
  segundos_sin_latido   integer,
  bateria_pct           integer,
  dispositivo_vinculado boolean,
  letrero               text
)
language sql
stable
set search_path = public
as $$
  select
    u.id,
    u.nombre,
    ST_Y(p.ubicacion::geometry),
    ST_X(p.ubicacion::geometry),
    r.id,
    r.nombre,
    r.color,
    r.icono,
    v.id,
    v.id is not null,
    p.velocidad_kmh,
    p.capturado_at,
    case
      when p.capturado_at is null then null
      else extract(epoch from (now() - p.capturado_at))::integer
    end,
    case
      when d.ultima_senal_at is null then null
      else extract(epoch from (now() - d.ultima_senal_at))::integer
    end,
    d.ultima_bateria,
    coalesce(d.vinculado, false),
    (select lv.nombre from letrero_vigente(u.id) lv)
  from unidades u
  left join rutas r on r.id = u.ruta_id
  left join dispositivos d on d.unidad_id = u.id
  left join viajes v on v.unidad_id = u.id and v.finalizado_at is null
  left join lateral (
    select pos.velocidad_kmh, pos.ubicacion, pos.capturado_at
    from posiciones pos
    where pos.unidad_id = u.id and pos.usable
    order by pos.capturado_at desc
    limit 1
  ) p on true
  where u.activa
  order by v.id is null, u.nombre;
$$;


-- ── LLEGADAS A UNA PARADA ──
--
-- Igual que en 19_velocidad_por_franja_y_retencion.sql, más el letrero vigente.
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
  velocidad_historica_kmh double precision,
  letrero                 text
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
    velocidad_historica_kmh(r.id),
    (select lv.nombre from letrero_vigente(u.id) lv)
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


-- ── LLEGADAS DE UNA RUTA ──
--
-- Igual que en 20_detalle_de_ruta.sql, más el letrero. Va después de
-- `llegadas_a_parada` porque la llama.
drop function if exists llegadas_de_ruta(uuid);

create function llegadas_de_ruta(ruta uuid)
returns table (
  parada_id               uuid,
  parada_nombre           text,
  parada_lat              double precision,
  parada_lng              double precision,
  -- Posición de la parada sobre el trazado, de 0 (inicio) a 1 (fin): el orden.
  avance                  double precision,
  unidad_id               uuid,
  unidad_nombre           text,
  unidad_lat              double precision,
  unidad_lng              double precision,
  viaje_id                uuid,
  segundos_sin_senal      integer,
  distancia_trazado_m     double precision,
  ya_paso                 boolean,
  velocidades_kmh         double precision[],
  incidencia_activa       boolean,
  velocidad_historica_kmh double precision,
  letrero                 text
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    p.id,
    p.nombre,
    ST_Y(p.ubicacion::geometry),
    ST_X(p.ubicacion::geometry),
    pr.avance,
    l.unidad_id,
    l.unidad_nombre,
    l.unidad_lat,
    l.unidad_lng,
    l.viaje_id,
    l.segundos_sin_senal,
    l.distancia_trazado_m,
    l.ya_paso,
    l.velocidades_kmh,
    l.incidencia_activa,
    l.velocidad_historica_kmh,
    l.letrero
  from paradas_por_ruta pr
  join rutas r on r.id = pr.ruta_id and r.activa
  join paradas p on p.id = pr.parada_id
  left join lateral (
    select *
    from llegadas_a_parada(p.id) x
    where x.ruta_id = llegadas_de_ruta.ruta
  ) l on true
  where pr.ruta_id = llegadas_de_ruta.ruta
  order by pr.avance, l.unidad_id;
$$;

grant execute on function llegadas_de_ruta(uuid) to anon, authenticated;
