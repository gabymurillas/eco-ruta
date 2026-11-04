# ADR-0003 — Geocercas evaluadas en el servidor, contra la posición de la unidad

| Campo | Valor |
|---|---|
| Estado | Aceptado |
| Registrado | 2026-11-04 |
| Responsable | Gabrieli Murillas Ramírez |

## Contexto

La revisión técnica planteó dónde evaluar las geocercas. En el cliente hay un límite de unas 100 por aplicación y depende de servicios del sistema operativo; además, el ciudadano no instala nada y muchos teléfonos no tienen Google Play Services.

## Decisión

Las geocercas se evalúan en el servidor contra la posición de la **unidad**, nunca contra la del ciudadano. El canal de notificación es la alerta en pantalla vía Realtime.

## Consecuencias

- Sin límite de geocercas y sin procesos en segundo plano en el ciudadano.
- Los avisos solo llegan con la página abierta (sin push), una limitación que se explica al ciudadano.
- Una única definición autoritativa de las reglas.

## Alternativas descartadas

- **Geofencing nativo en el cliente:** exige instalar una app y tiene límites.
- **FCM:** no disponible en muchos teléfonos venezolanos.
