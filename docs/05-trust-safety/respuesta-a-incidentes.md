# Respuesta a incidentes

| Campo | Valor |
|---|---|
| Responsable de guardia | Gabrieli Murillas Ramírez (única persona del equipo) |
| Última revisión | 2026-11-04 |

## Severidades

| Nivel | Definición | Ejemplos | Respuesta |
|---|---|---|---|
| **S1 — Crítico** | Riesgo para personas o compromiso total | Filtración de `service_role`, admin comprometido, exposición que pone en riesgo a un chofer | Inmediata; contener primero |
| **S2 — Alto** | Función principal caída o datos falsos | Avisos masivos erróneos, telemetría falsa, backend pausado | Mismo día |
| **S3 — Medio** | Degradación parcial | Una unidad sin señal, OSRM o Photon caídos | Siguiente jornada |
| **S4 — Bajo** | Cosmético | Texto o estilo | Planificado |

## Ciclo

1. **Detectar:** monitoreo del admin (unidades sin señal), errores de Vercel y Supabase, reportes.
2. **Contener:** detener el daño (revocar, desactivar, rotar).
3. **Erradicar:** corregir la causa.
4. **Recuperar:** restablecer y verificar.
5. **Aprender:** escribir una nota postmortem sin culpables en `docs/05-trust-safety/postmortems/`
   (fecha, impacto, línea de tiempo, causa, acciones).

## Guías de actuación

### G1 — Teléfono de una unidad perdido o robado (S2)
1. En `/admin/unidades`, eliminar la unidad (hoy es la única forma de revocar la sesión). Cuando
   exista ADM-12, desvincular.
2. Verificar en el monitoreo que ya no lleguen posiciones.
3. Crear la unidad de nuevo y vincular un teléfono nuevo.

### G2 — Clave `service_role` filtrada (S1)
1. Rotar las claves JWT y API en el panel de Supabase.
2. Actualizar los secretos de las Edge Functions y redesplegarlas.
3. Revisar en los registros los accesos anómalos y la integridad de las tablas.
4. Si estaba en git, purgarla del historial y asumirla comprometida igual.

### G3 — Cuenta del admin comprometida (S1)
1. Cambiar la contraseña y cerrar sesiones desde Supabase Auth.
2. Revisar los cambios recientes en rutas, paradas, parámetros y unidades.
3. Activar MFA (brecha TS-05).

### G4 — Avisos o tiempos estimados masivamente erróneos (S2)
1. Revisar los parámetros (un `update` equivocado es la causa más probable).
2. Revisar `eventos_geocerca` del viaje afectado y la exactitud de las posiciones.
3. Si hace falta, apagar `notifica` en las paradas afectadas mientras se corrige.

### G5 — Exposición que pone en riesgo a un chofer (S1)
1. Desactivar la ruta o la unidad (`activa = false`): deja de verse al público.
2. Evaluar si el dato expuesto contradice la [política de exposición](politica-de-exposicion.md).
3. Corregir y registrar en el [registro de brechas](registro-de-brechas.md).

### G6 — Backend pausado o caído (S2)
1. Reactivar el proyecto en Supabase (el plan gratuito se pausa por inactividad).
2. Los dispositivos conservan hasta 2 h en su buffer y entregan al volver.
3. Comunicar en la web si la caída es larga.

### G7 — Contenido inapropiado en una incidencia (S3)
1. Marcar la incidencia como resuelta o borrar la descripción desde el admin o con SQL.
2. Hablar con el ente gestor sobre el uso del campo libre.
