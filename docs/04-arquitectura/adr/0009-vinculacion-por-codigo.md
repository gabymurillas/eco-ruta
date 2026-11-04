# ADR-0009 — Vinculación por código canjeado en el servidor; claims en app_metadata

| Campo | Valor |
|---|---|
| Estado | Aceptado |
| Registrado | 2026-11-04 |
| Responsable | Gabrieli Murillas Ramírez |

## Contexto

El dispositivo debe escribir solo las posiciones de su unidad. RLS necesita un claim confiable. La clave service_role se extrae de un APK en minutos.

## Decisión

El admin genera un código de 5 caracteres (alfabeto sin caracteres ambiguos, válido 10 minutos, de un solo uso). La Edge Function `vincular-dispositivo` lo canjea y crea la cuenta del teléfono con `app_metadata.unidad_id`. RLS compara contra ese claim. `service_role` nunca entra al APK.

## Consecuencias

- La autorización no depende del cliente.
- `user_metadata` no sirve: el teléfono podría reasignarse a otra unidad.

## Alternativas descartadas

- **service_role en la app:** salta RLS por completo.
- **Cuentas por chofer:** contradice el ADR-0002.
