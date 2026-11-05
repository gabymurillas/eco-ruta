-- ============================================================
-- Tiempo estimado en la web del ciudadano (CIU-05, CIU-11)
--
-- Hasta aquí `llegadas_a_parada` solo traía la distancia en línea recta, y la web
-- decía «En camino» sin cifra. Ahora devuelve lo que el dominio necesita para
-- calcular el tiempo estimado (ecoruta-web/src/domain/eta.ts):
--
--   distancia_trazado_m    lo que le falta a la unidad sobre el trazado hasta la
--                          parada. Nulo si no hay trazado o posición, o si la
--                          unidad ya dejó atrás la parada en un trazado abierto.
--   ya_paso                la unidad está más adelante que la parada sobre el
--                          trazado y la ruta no vuelve a empezar (no es circular).
--   velocidades_kmh        velocidades de las últimas 5 posiciones usables del
--                          viaje; el promedio y el piso los decide el dominio.
--   incidencia_activa      hay una incidencia sin resolver en la ruta.
--
-- El cálculo se queda en TypeScript a propósito: la regla (piso de velocidad,
-- redondeo, penalización) está probada allí y la comparte la tesis.
--
-- Distancia sobre el trazado: se proyectan la unidad y la parada sobre la línea
-- (ST_LineLocatePoint) y se mide el tramo entre ambas (ST_LineSubstring). Si la
-- unidad quedó más adelante:
--   - en un trazado circular (inicio y fin a menos de distancia_parada_trazado_m)
--     se da la vuelta: lo que falta hasta el final más lo que va del inicio a la
--     parada;
--   - en uno abierto, la unidad ya pasó. Salvo que la diferencia sea menor que esa
--     misma tolerancia: es la deriva del GPS con la unidad encima de la parada, y
--     se informa como distancia 0.
--
-- Base ya existente: correr este archivo. En una base nueva bastan 02 y 04.
-- El drop es necesario: `create or replace` no admite cambiar el tipo de retorno.
-- ============================================================

insert into parametros (clave, valor, descripcion) values
  ('penalizacion_incidencia_pct', 25,
   'Porcentaje que se suma al tiempo estimado mientras la ruta tiene una incidencia activa')
on conflict (clave) do nothing;

drop function if exists llegadas_a_parada(uuid);

create function llegadas_a_parada(parada uuid)
returns table (
  unidad_id           uuid,
  unidad_nombre       text,
  unidad_lat          double precision,
  unidad_lng          double precision,
  viaje_id            uuid,
  segundos_sin_senal  integer,
  distancia_recta_m   double precision,
  distancia_trazado_m double precision,
  ya_paso             boolean,
  velocidades_kmh     double precision[],
  incidencia_activa   boolean,
  ultima_parada       text,
  ruta_id             uuid,
  ruta_nombre         text,
  ruta_color          text,
  ruta_icono          text,
  ruta_tiene_trazado  boolean
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
    r.trazado is not null
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
