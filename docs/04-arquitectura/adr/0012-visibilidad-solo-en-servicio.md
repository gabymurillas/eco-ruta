# ADR-0012 — Las unidades son visibles al público solo durante un viaje activo

| Campo | Valor |
|---|---|
| Estado | Aceptado (implementación pendiente: brecha TS-01) |
| Registrado | 2026-11-04 |
| Responsable | Gabrieli Murillas Ramírez |

## Contexto

Publicar la posición en vivo de vehículos en Venezuela puede facilitar robos o extorsión a choferes. Hoy la RLS pública permite leer todas las posiciones usables y todos los viajes, incluidos los terminados.

## Decisión

El público solo ve posiciones de viajes **abiertos** (`finalizado_at is null`) y solo los viajes abiertos. El recorrido histórico es exclusivo del admin. Nunca se publica la identidad del chofer (el sistema no la guarda) ni la salud del equipo.

## Consecuencias

- Hay que reescribir las políticas `publico_lee_posiciones` y `publico_lee_viajes` y revisar `recorrido_de_viaje` y Realtime (que respeta RLS).
- Hay que verificar que la web pública no dependa de posiciones fuera de un viaje (por ejemplo, «última posición conocida» de una unidad detenida) antes de aplicar el cambio.

## Alternativas descartadas

- **Sin restricción:** riesgo para choferes e historial de patrones expuesto.
- **Retraso deliberado de la posición:** degrada el tiempo estimado; se puede reconsiderar en H2.
