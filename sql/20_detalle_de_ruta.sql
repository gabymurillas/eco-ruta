-- ============================================================
-- 20 · Detalle de ruta para el ciudadano (CIU-16)
--
-- La pantalla /ruta/[id] lista las paradas de una ruta en el orden en que la
-- recorre y, en cada una, cuándo llega la próxima unidad.
--
-- No se escribe un cálculo nuevo: por cada parada se llama a `llegadas_a_parada`
-- y se queda con las unidades de esta ruta. Así el tiempo estimado del detalle es
-- el mismo que el de «mi parada» —trazado, vuelta en las rutas circulares, «ya
-- pasó», historial por franja— y no hay dos versiones que puedan diferir.
--
-- Una parada sin unidades en camino sale igual, con las columnas de la unidad
-- nulas: la lista debe mostrar el recorrido completo aunque nadie esté en la calle.
--
-- Security invoker: no expone nada que `llegadas_a_parada` no entregue ya al
-- público (ver docs/05-trust-safety/politica-de-exposicion.md).
--
-- Costo: una llamada a `llegadas_a_parada` por parada. Con las rutas de una
-- ciudad pequeña (decenas de paradas) es una sola consulta de milisegundos, y
-- ahorra al teléfono del ciudadano una petición por parada.
--
-- Corre después de 19. Es idempotente: se puede volver a aplicar.
-- ============================================================

create or replace function llegadas_de_ruta(ruta uuid)
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
  velocidad_historica_kmh double precision
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
    l.velocidad_historica_kmh
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
