# Registro de brechas

Diferencias conocidas entre lo que prometen la política y la arquitectura y lo que hace hoy el
código. Se detectaron al documentar el 2026-11-04. Una brecha se cierra con un commit que la
referencia (`TS-XX`) y su verificación.

| ID | Brecha | Severidad | Requisito | Remediación propuesta | Estado |
|---|---|---|---|---|---|
| TS-01 | `publico_lee_posiciones` (`using (usable)`) y `publico_lee_viajes` (`using (true)`) exponen recorridos terminados. `recorrido_de_viaje` (invoker) permite reconstruir cualquier viaje desde la API pública | **Alta** | CIU-18 | Políticas: posiciones `usable and exists (viaje abierto)`; viajes `finalizado_at is null`. Verificar antes qué consume la web pública. Probar en un clúster desechable | **Cerrada** (2026-11-04): `sql/13_exposicion_solo_en_servicio.sql`, probada en un clúster desechable |
| TS-02 | No existe un borrado de posiciones con más de 90 días | Media | SIS-06 | Job con pg_cron después del agregado de velocidades; parámetro `retencion_posiciones_dias` | Abierta |
| TS-03 | `incidencias.descripcion` (texto libre) es legible por `anon` aunque la web no la muestre | Media | — | Lectura pública por una vista sin `descripcion`, o un `grant` de columnas | Abierta |
| TS-04 | Revocar un teléfono exige eliminar la unidad y su historial | Media | ADM-12 | Función `desvincular_dispositivo`: borra el usuario Auth y limpia `dispositivos` sin tocar la unidad | Abierta |
| TS-05 | El admin entra sin MFA | Media | — | Activar TOTP en Supabase Auth y exigir `aal2` en `es_admin()` | Abierta |
| TS-06 | Uso de OSM, OSRM y Photon públicos: dependencia de sus políticas de uso; ven la IP y la zona que consulta el usuario | Baja | — | Vigilar el volumen; proveedor con acuerdo si hay piloto; mencionarlo en [privacidad](../06-legal/privacidad.md) | Aceptada para H1 |
| TS-07 | La columna `dispositivos.push_token` existe aunque push está fuera de alcance | Baja | — | No poblarla; eliminarla en una migración futura | Abierta |
| TS-08 | `viajes_por_dia` existe en la base pero no en `sql/`: el esquema no es reproducible desde el repositorio | Baja | — | Volcar su definición a `sql/` | Cerrada: `sql/15_historicos_por_ruta.sql` |
| TS-09 | La ubicación exacta del ciudadano viaja como parámetro de `paradas_cercanas` y puede quedar en los registros del proveedor | Baja | — | Redondear a unos 3 decimales (unos 100 m) en el cliente antes de llamar | Abierta |
| TS-10 | Sin límite de intentos en `vincular-dispositivo` ni límites propios contra el raspado de la API pública | Baja | — | Contador de intentos por IP o por código; vigilar el uso | Abierta |
