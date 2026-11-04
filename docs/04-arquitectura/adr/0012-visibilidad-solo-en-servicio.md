# ADR-0012 — Las unidades son visibles al público solo durante un viaje activo

| Campo | Valor |
|---|---|
| Estado | Aceptado e implementado (`sql/13_exposicion_solo_en_servicio.sql`, cierra TS-01) |
| Registrado | 2026-11-04 |
| Responsable | Gabrieli Murillas Ramírez |

## Contexto

Publicar la posición en vivo de vehículos en Venezuela puede facilitar robos o extorsión a choferes. Hoy la RLS pública permite leer todas las posiciones usables y todos los viajes, incluidos los terminados.

## Decisión

El público solo ve posiciones de viajes **abiertos** (`finalizado_at is null`) y solo los viajes abiertos. El recorrido histórico es exclusivo del admin. Nunca se publica la identidad del chofer (el sistema no la guarda) ni la salud del equipo.

## Consecuencias

- Hay que reescribir las políticas `publico_lee_posiciones` y `publico_lee_viajes` y revisar `recorrido_de_viaje` y Realtime (que respeta RLS).
- La web pública dibujaba unidades fuera de servicio en su última posición; con la política nueva `llegadas_a_parada` devuelve sus coordenadas nulas, la web las omite del mapa y las lista como «sin recorrido». No hizo falta cambiar la interfaz.
- `registrar-posicion` inserta sin `RETURNING`: un lote atrasado que llega tras «finalizar» se sigue guardando.

## Alternativas descartadas

- **Sin restricción:** riesgo para choferes e historial de patrones expuesto.
- **Retraso deliberado de la posición:** degrada el tiempo estimado; se puede reconsiderar en H2.
