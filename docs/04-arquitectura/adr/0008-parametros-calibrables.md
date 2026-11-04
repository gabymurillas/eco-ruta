# ADR-0008 — Valores calibrables en la tabla parametros

| Campo | Valor |
|---|---|
| Estado | Aceptado |
| Registrado | 2026-11-04 |
| Responsable | Gabrieli Murillas Ramírez |

## Contexto

Los umbrales del algoritmo (exactitud, permanencia, histéresis, radios e intervalos) no se conocen hasta la prueba de campo de GPS, y los usan el servidor, la web y la app.

## Decisión

Todo valor calibrable vive en la tabla `parametros`, legible por el público y editable solo por el admin. Ningún cliente lo escribe fijo en el código.

## Consecuencias

- Calibrar es un `update`, no publicar una versión nueva.
- Las tres superficies usan los mismos números.

## Alternativas descartadas

- **Constantes en el código:** se desincronizan y obligan a publicar un APK nuevo.
