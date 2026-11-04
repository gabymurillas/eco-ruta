-- ============================================================
-- Monitoreo en vivo del admin: publicar en Realtime lo que mueve el mapa
-- Corre después de 01_schema.sql y 03_rls.sql. Es idempotente.
--
-- Supabase solo emite cambios de las tablas que están en `supabase_realtime`.
-- El panel de monitoreo escucha estas tres:
--
--   posiciones   → una unidad se movió
--   viajes       → una unidad inició o terminó su recorrido
--   incidencias  → se reportó o se resolvió una
--
-- El panel no arma el estado con lo que llega por el canal: lo usa como señal
-- para volver a pedir `estado_flota` al servidor. Así la regla de salud de cada
-- unidad vive en un solo lugar y el canal no tiene que traer la geografía.
--
-- `dispositivos` (latido y batería) no se publica: RLS la reserva al admin y su
-- cambio no mueve el mapa. El panel la recoge en su revisión periódica.
--
-- Costo: Realtime revisa RLS de cada fila por cada suscriptor. Con `posiciones`
-- es una fila por unidad cada 5 s; a la escala de una ciudad pequeña y unos
-- pocos administradores mirando, es despreciable.
-- ============================================================


do $$
declare
  tabla text;
begin
  foreach tabla in array array['posiciones', 'viajes', 'incidencias'] loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = tabla
    ) then
      execute format('alter publication supabase_realtime add table %I', tabla);
    end if;
  end loop;
end
$$;
