-- ============================================================
-- Trazado asistido: puntos clave y trazado desde un viaje real
--
-- Para una base que ya tiene 01 a 10 aplicados. Es idempotente. En una
-- instalación nueva no hace falta: 01 ya trae la columna.
--
-- DESPUÉS de este archivo hay que volver a correr 04_funciones.sql:
-- `guardar_trazado_de_ruta` pasa a recibir los puntos clave, y se agregan
-- `viajes_grabados` y `recorrido_de_viaje`.
-- ============================================================

alter table rutas add column if not exists puntos_clave jsonb;
