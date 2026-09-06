-- ============================================================
-- Funciones de consulta
-- Corre después de 01_schema.sql.
-- ============================================================

-- La parada más cercana la resuelve PostGIS en el servidor, no el navegador:
-- el índice GiST sobre paradas.ubicacion hace el trabajo y el cliente solo
-- recibe el resultado, en vez de descargar todas las paradas para medirlas.
--
-- security invoker: la función respeta las políticas RLS de lectura pública,
-- así que el ciudadano la llama sin autenticarse y no ve nada que no pudiera
-- ver consultando las tablas directamente.
create or replace function paradas_cercanas(
  lat            double precision,
  lng            double precision,
  radio_max_m    integer default 1500,
  limite         integer default 5
)
returns table (
  parada_id     uuid,
  parada_nombre text,
  distancia_m   double precision,
  ruta_id       uuid,
  ruta_nombre   text,
  ruta_tipo     text,
  ruta_icono    text,
  ruta_color    text
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    p.id,
    p.nombre,
    ST_Distance(p.ubicacion, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography),
    r.id,
    r.nombre,
    r.tipo,
    r.icono,
    r.color
  from paradas p
  join rutas r on r.id = p.ruta_id
  where r.activa
    and ST_DWithin(
          p.ubicacion,
          ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
          radio_max_m
        )
  order by p.ubicacion <-> ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
  limit limite;
$$;
