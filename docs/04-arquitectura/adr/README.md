# Registro de decisiones de arquitectura (ADR)

Formato Nygard/MADR resumido: contexto, decisión, consecuencias y alternativas. Un ADR aceptado
no se edita para cambiar la decisión: se escribe uno nuevo que lo **reemplaza** y se marca el
anterior como «Reemplazado por ADR-XXXX».

| ADR | Decisión | Estado |
|---|---|---|
| [0001](0001-supabase-como-backend.md) | Supabase como backend, con Edge Functions en lugar de Express | Aceptado |
| [0002](0002-dispositivo-pertenece-a-la-ruta.md) | El dispositivo pertenece a la ruta, no al chofer | Aceptado |
| [0003](0003-geocercas-en-el-servidor.md) | Geocercas evaluadas en el servidor, contra la unidad | Aceptado |
| [0004](0004-evaluacion-sincrona.md) | Evaluación síncrona en `registrar-posicion` | Aceptado |
| [0005](0005-leaflet-y-openstreetmap.md) | Leaflet + OpenStreetMap en lugar de Mapbox | Aceptado |
| [0006](0006-android-nativo.md) | App del dispositivo en Android nativo; iOS descartado | Aceptado |
| [0007](0007-paradas-de-la-ciudad.md) | Paradas de la ciudad; rutas por trazado | Aceptado |
| [0008](0008-parametros-calibrables.md) | Valores calibrables en `parametros` | Aceptado |
| [0009](0009-vinculacion-por-codigo.md) | Vinculación por código; claims en `app_metadata` | Aceptado |
| [0010](0010-ciudadano-anonimo.md) | Ciudadano anónimo; preferencias en el navegador | Aceptado |
| [0011](0011-eta-estimado-con-historial.md) | Tiempo estimado con historial por franja (versión mínima) | Propuesto |
| [0012](0012-visibilidad-solo-en-servicio.md) | Unidades visibles solo durante un viaje activo | Aceptado e implementado |
| [0013](0013-retencion-de-telemetria.md) | Retención de 90 días de la telemetría cruda | Aceptado, implementación pendiente |
| [0014](0014-plataforma-multiorganizacion.md) | Una sola plataforma para varias organizaciones | Propuesto (después de la tesis) |
| [0015](0015-roles-del-panel-y-equipo.md) | Dos roles en el panel (admin y operador) y gestión del equipo por Edge Function | Aceptado; implementado en el código, pendiente de aplicar en Supabase |

Plantilla para un ADR nuevo: copiar cualquiera, numerar en orden y agregarlo a esta tabla.
