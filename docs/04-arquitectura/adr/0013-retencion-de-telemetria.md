# ADR-0013 — Retención de 90 días para la telemetría cruda

| Campo | Valor |
|---|---|
| Estado | Aceptado (implementado en `sql/19`; cierra la brecha TS-02) |
| Registrado | 2026-11-04 |
| Responsable | Gabrieli Murillas Ramírez |

## Contexto

`posiciones` es la tabla de mayor escritura. El plan gratuito tiene límites de almacenamiento, y conservar trayectorias detalladas para siempre no tiene un propósito proporcional.

## Decisión

Las posiciones crudas con más de `retencion_posiciones_dias` (90) se borran con un job programado (pg_cron), **después** de alimentar los agregados (ADR-0011) e históricos. Los agregados se conservan indefinidamente.

Implementación (`sql/19_velocidad_por_franja_y_retencion.sql`): el job `ecoruta-mantenimiento-nocturno` de pg_cron corre a las 3:30 de Caracas (07:30 UTC) y ejecuta primero `agregar_velocidades_de_viajes()` y luego `depurar_posiciones_antiguas()`. Solo se borran posiciones sin viaje o cuyo viaje ya tiene su fila en `velocidades_de_viaje`; las de un viaje abierto se quedan. `retencion_posiciones_dias` vive solo en la tabla, no en `/admin/parametros`, porque un error borraría datos; además la función aplica un piso de 30 días.

## Consecuencias

- Almacenamiento acotado y una base de privacidad más sólida.
- El trazado desde un viaje grabado (ADM-06) solo funciona con viajes de los últimos 90 días.

## Alternativas descartadas

- **Indefinido:** crecimiento sin límite y sin propósito.
- **30 días:** insuficiente para acumular historial por franja.
