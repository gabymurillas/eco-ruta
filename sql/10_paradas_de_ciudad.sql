-- ============================================================
-- Paradas de la ciudad: dejan de pertenecer a una ruta
--
-- Antes cada parada tenía su `ruta_id` y su `orden`, así que una esquina donde
-- paran tres rutas se cargaba tres veces. Ahora la parada se registra una vez y
-- las rutas que pasan por ella se calculan desde el trazado (vista
-- `paradas_por_ruta`, en 04_funciones.sql).
--
-- Para una base que ya tiene 01 a 09 aplicados. Es idempotente. En una
-- instalación nueva no hace falta: 01 y 02 ya traen el modelo nuevo.
--
-- ORDEN, seguido y sin pausa:
--   1. este archivo
--   2. 04_funciones.sql  (vista nueva y consultas que la usan)
--   3. 07_geocercas.sql  (la evaluación toma las paradas desde la vista)
-- Entre el 1 y el 3 la evaluación de geocercas falla, porque la versión vieja de
-- `estado_de_geocercas` busca `paradas.ruta_id`. La Edge Function no se vuelve a
-- desplegar: la respuesta de la función no cambia.
-- ============================================================


-- Las paradas existentes se borran: estaban duplicadas por ruta, y se vuelven a
-- cargar una sola vez desde el catálogo del admin. Arrastra por cascada sus
-- eventos de geocerca y avisos, que dejan de tener a qué parada referirse.
delete from paradas;

alter table paradas drop constraint if exists paradas_ruta_id_orden_key;
drop index if exists paradas_ruta_idx;
alter table paradas drop column if exists ruta_id;
alter table paradas drop column if exists orden;

insert into parametros (clave, valor, descripcion) values
  ('distancia_parada_trazado_m', 40,
   'Distancia maxima entre una parada y el trazado para que la ruta pase por ella')
on conflict (clave) do nothing;
