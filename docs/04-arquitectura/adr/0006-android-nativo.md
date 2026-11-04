# ADR-0006 — App del dispositivo en Android nativo; iOS descartado

| Campo | Valor |
|---|---|
| Estado | Aceptado |
| Registrado | 2026-11-04 |
| Responsable | Gabrieli Murillas Ramírez |

## Contexto

El plan original era Expo/React Native. La app es un proceso de GPS en segundo plano que debe sobrevivir a la gestión agresiva de batería de Android en teléfonos baratos.

## Decisión

La app es Android nativo (Kotlin + Jetpack Compose) en un repositorio aparte. Solo Android. Se comunica con el backend exclusivamente por el [contrato de vinculación](../../contrato-vinculacion.md).

## Consecuencias

- Control directo de servicios en primer plano, modo kiosco y arranque automático.
- Se tiró un scaffold de Expo sin código propio (commit `690633e`).
- Dos repositorios: los cambios del backend se hacen aquí y se anuncian allá.

## Alternativas descartadas

- **Expo/React Native:** una capa de abstracción sobre lo más delicado.
- **iOS:** fuera del alcance; los teléfonos dedicados son Android.
