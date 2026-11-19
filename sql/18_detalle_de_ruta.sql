-- ============================================================
-- 18 · Detalle de ruta del ciudadano (CIU-16)
--
-- La página /ruta/[id] dice, parada por parada, cuánto le falta a la próxima
-- unidad. Con `llegadas_a_parada` haría falta una consulta por parada y por
-- refresco; estas dos funciones devuelven todo en dos consultas: dónde queda
-- cada parada y dónde va cada unidad sobre el trazado, en metros desde el
-- inicio. La resta (y la vuelta en una ruta circular) la hace
-- `domain/recorrido.ts` con las mismas reglas que sql/14.
--
-- Exposición: nada nuevo. El trazado y las paradas ya son públicos, y solo salen
-- unidades con un viaje abierto (ADR-0012). Son security invoker: el ciudadano
-- no ve más de lo que RLS ya le deja leer.
--
-- Corre después de 17. Es idempotente.
-- ============================================================


-- ── PARADAS, CON SU POSICIÓN SOBRE EL TRAZADO ──
--
-- `longitud_m` y `circular` se repiten en cada fila para no hacer una tercera
-- consulta. Circular: inicio y fin a menos de `distancia_parada_trazado_m`, el
-- mismo criterio que `llegadas_a_parada`.
create or replace function paradas_en_recorrido(ruta uuid)
returns table (
  parada_id     uuid,
  parada_nombre text,
  orden         integer,
  parada_lat    double precision,
  parada_lng    double precision,
  avance_m      double precision,
  longitud_m    double precision,
  circular      boolean
)
language sql
stable
security invoker
set search_path = public
as $$
  with tolerancia as (
    select coalesce(
      (select valor from parametros where clave = 'distancia_parada_trazado_m'),
      40
    )::double precision as m
  )
  select
    p.id,
    p.nombre,
    (row_number() over (order by pr.avance))::integer,
    ST_Y(p.ubicacion::geometry),
    ST_X(p.ubicacion::geometry),
    pr.avance * ST_Length(r.trazado),
    ST_Length(r.trazado),
    ST_Distance(
      ST_StartPoint(r.trazado::geometry)::geography,
      ST_EndPoint(r.trazado::geometry)::geography
    ) < t.m
  from paradas_por_ruta pr
  join paradas p on p.id = pr.parada_id
  join rutas r on r.id = pr.ruta_id and r.activa
  cross join tolerancia t
  where pr.ruta_id = ruta
  order by pr.avance;
$$;


-- ── UNIDADES EN VIAJE, CON SU POSICIÓN SOBRE EL TRAZADO ──
--
-- Solo viajes abiertos de esta ruta (el viaje guarda su ruta: si al teléfono le
-- cambian la ruta a mitad de recorrido, el viaje sigue contando donde empezó).
-- Una unidad con viaje abierto y sin ninguna lectura sale igual, con posición
-- nula: es «sin confirmar», no «no existe».
create or replace function unidades_en_recorrido(ruta uuid)
returns table (
  unidad_id          uuid,
  unidad_nombre      text,
  unidad_lat         double precision,
  unidad_lng         double precision,
  viaje_id           uuid,
  segundos_sin_senal integer,
  avance_m           double precision,
  velocidades_kmh    double precision[]
)
language sql
stable
security invoker
set search_path = public
as $$
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
      when r.trazado is null or pos.ubicacion is null then null
      else ST_LineLocatePoint(r.trazado::geometry, pos.ubicacion::geometry)
             * ST_Length(r.trazado)
    end,
    vel.velocidades
  from viajes v
  join rutas r on r.id = v.ruta_id and r.activa
  join unidades u on u.id = v.unidad_id and u.activa
  left join lateral (
    select p2.ubicacion, p2.capturado_at
    from posiciones p2
    where p2.viaje_id = v.id and p2.usable
    order by p2.capturado_at desc
    limit 1
  ) pos on true
  left join lateral (
    select array_agg(rec.velocidad_kmh::double precision order by rec.capturado_at desc)
             as velocidades
    from (
      select p3.velocidad_kmh, p3.capturado_at
      from posiciones p3
      where p3.viaje_id = v.id and p3.usable
      order by p3.capturado_at desc
      limit 5
    ) rec
  ) vel on true
  where v.ruta_id = ruta
    and v.finalizado_at is null
  order by u.nombre;
$$;

grant execute on function paradas_en_recorrido(uuid) to anon, authenticated;
grant execute on function unidades_en_recorrido(uuid) to anon, authenticated;
