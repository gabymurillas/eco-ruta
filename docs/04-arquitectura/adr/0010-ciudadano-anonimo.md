# ADR-0010 — El ciudadano es anónimo; sus preferencias viven en el navegador

| Campo | Valor |
|---|---|
| Estado | Aceptado |
| Registrado | 2026-11-04 |
| Responsable | Gabrieli Murillas Ramírez |

## Contexto

Cero fricción es un principio del producto. Las cuentas agregan datos personales y obligaciones.

## Decisión

El ciudadano nunca se autentica. «Mi parada» se guarda en `localStorage`. Lee los datos públicos por RLS y escucha los avisos por Realtime. Sin ubicación, no hay elección manual de parada (decisión definitiva de producto).

## Consecuencias

- No hay datos personales del ciudadano en la base.
- No hay sincronización entre dispositivos ni push.
- La ubicación se envía como parámetro de una RPC para buscar paradas, pero no se almacena (ver [privacidad](../../06-legal/privacidad.md)).

## Alternativas descartadas

- **Cuentas opcionales:** fuera de alcance (PRD §3.2).
