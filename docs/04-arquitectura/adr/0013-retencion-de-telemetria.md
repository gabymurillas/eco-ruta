# ADR-0013 — Retención de 90 días para la telemetría cruda

| Campo | Valor |
|---|---|
| Estado | Aceptado (implementación pendiente: brecha TS-02) |
| Registrado | 2026-11-04 |
| Responsable | Gabrieli Murillas Ramírez |

## Contexto

`posiciones` es la tabla de mayor escritura. El plan gratuito tiene límites de almacenamiento, y conservar trayectorias detalladas para siempre no tiene un propósito proporcional.

## Decisión

Las posiciones crudas con más de `retencion_posiciones_dias` (90) se borran con un job programado (pg_cron), **después** de alimentar los agregados (ADR-0011) e históricos. Los agregados se conservan indefinidamente.

## Consecuencias

- Almacenamiento acotado y una base de privacidad más sólida.
- El trazado desde un viaje grabado (ADM-06) solo funciona con viajes de los últimos 90 días.

## Alternativas descartadas

- **Indefinido:** crecimiento sin límite y sin propósito.
- **30 días:** insuficiente para acumular historial por franja.
