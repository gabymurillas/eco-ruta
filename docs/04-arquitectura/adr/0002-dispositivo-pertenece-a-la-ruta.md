# ADR-0002 — El dispositivo pertenece a la ruta, no al chofer

| Campo | Valor |
|---|---|
| Estado | Aceptado |
| Registrado | 2026-11-04 |
| Responsable | Gabrieli Murillas Ramírez |

## Contexto

El análisis de factibilidad señaló la adopción por choferes como riesgo crítico: depender de que cada uno instale y mantenga una app en su teléfono personal produce abandono. Comprar hardware GPS por unidad no cabe en el presupuesto.

## Decisión

Cada unidad lleva un teléfono Android barato y dedicado, conectado al sistema eléctrico del vehículo, en modo kiosco y vinculado una sola vez a la unidad. El chofer solo usa dos botones (iniciar y finalizar) y reporta incidencias.

## Consecuencias

- No hay cuentas de choferes ni gestión de identidades de personas.
- La batería deja de ser crítica; el consumo de datos sí importa (emisión adaptativa).
- El teléfono es un activo físico que se puede perder o robar: hace falta revocarlo (ADM-11 y ADM-12).

## Alternativas descartadas

- **App en el teléfono personal del chofer:** alta fricción y abandono.
- **Rastreador GPS dedicado:** costo de hardware y de integración.
