# ADR-0007 — Las paradas son de la ciudad; las rutas pasan por las que toca su trazado

| Campo | Valor |
|---|---|
| Estado | Aceptado |
| Registrado | 2026-11-04 |
| Responsable | Gabrieli Murillas Ramírez |

## Contexto

Al principio las paradas pertenecían a una ruta y tenían un orden. Una misma esquina donde paran tres rutas se registraba tres veces, y cambiar un trazado obligaba a reasignar paradas a mano.

## Decisión

Las paradas son de la ciudad. La vista `paradas_por_ruta` calcula qué rutas pasan por cada una: las que tienen el trazado a menos de `distancia_parada_trazado_m` (40 m). No hay asignación manual.

## Consecuencias

- Una parada se registra una sola vez.
- Una ruta sin trazado no pasa por ninguna parada.
- El umbral es calibrable.

## Alternativas descartadas

- **Parada por ruta con orden:** duplicación y mantenimiento manual.
