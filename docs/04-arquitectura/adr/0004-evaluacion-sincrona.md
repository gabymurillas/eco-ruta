# ADR-0004 — Evaluación síncrona en registrar-posicion

| Campo | Valor |
|---|---|
| Estado | Aceptado |
| Registrado | 2026-11-04 |
| Responsable | Gabrieli Murillas Ramírez |

## Contexto

El producto del sistema son los avisos. La evaluación de geocercas podía dispararse con un webhook de pg_net sobre el insert, con un trigger PL/pgSQL o en la misma llamada que guarda la posición.

## Decisión

La Edge Function `registrar-posicion` guarda la telemetría y evalúa las geocercas en la **misma llamada**. Si la evaluación falla, el error vuelve a la app, que reintenta desde su buffer.

## Consecuencias

- Ningún fallo de evaluación queda en silencio.
- La app envía la cola completa de un viaje en una sola llamada, porque el servidor evalúa contra la lectura más reciente.
- Las reglas viven en TypeScript puro (`_dominio/`), legibles y defendibles.

## Alternativas descartadas

- **Webhook pg_net:** asíncrono, sin reintento y con un secreto guardado en la base.
- **Trigger PL/pgSQL:** lleva la lógica crítica a SQL, más difícil de probar y explicar.
