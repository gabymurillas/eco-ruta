# Política de exposición de datos

| Campo | Valor |
|---|---|
| Estado | Aprobada (2026-11-04) |
| Decisión técnica | [ADR-0012](../04-arquitectura/adr/0012-visibilidad-solo-en-servicio.md), [ADR-0013](../04-arquitectura/adr/0013-retencion-de-telemetria.md) |

## Regla general

> **El público ve lo necesario para esperar una unidad, y nada más.**

## Matriz de visibilidad

| Dato | Público (ciudadano) | Dispositivo | Admin |
|---|---|---|---|
| Rutas activas: trazado, color, ícono, horario | ✅ | ✅ | ✅ |
| Paradas | ✅ | ✅ | ✅ |
| Nombre de la unidad y su ruta | ✅ | Solo la suya | ✅ |
| Posición en vivo | ✅ **solo durante un viaje activo** | Solo la suya (escritura) | ✅ |
| Recorridos de viajes terminados | ❌ | ❌ | ✅ (90 días) |
| Viajes abiertos (en servicio o no) | ✅ | Solo los suyos | ✅ |
| Avisos «se acerca» y «ya pasó» | ✅ | — | ✅ |
| Incidencias activas: tipo y ruta | ✅ | Inserta las suyas | ✅ |
| Texto libre de incidencias | ❌ (objetivo; hoy ✅, TS-03) | Inserta | ✅ |
| Batería y última señal del teléfono | ❌ | Escribe | ✅ |
| Identidad del chofer | **No existe en el sistema** | — | — |
| Ubicación del ciudadano | Solo en su navegador | — | ❌ |
| Parámetros calibrables | ✅ (lectura) | ✅ (lectura) | ✅ |

## Reglas

1. **Fuera de servicio, invisible.** Al finalizar el viaje, la unidad desaparece del mapa
   público.
2. **Sin personas.** No se registran nombres, cédulas, fotos ni teléfonos de choferes. Una
   función que lo requiera necesita revisión de Trust & Safety y un ADR.
3. **Sin evaluación de personas.** Los históricos miden rutas y unidades, nunca choferes.
4. **Retención.** Las posiciones crudas se borran a los 90 días; quedan solo los agregados por
   ruta y franja, que no permiten reconstruir un recorrido individual.
5. **Mínimo en tránsito.** La ubicación del ciudadano se usa para buscar paradas y no se guarda.
   Objetivo: redondearla en el cliente antes de enviarla (TS-09).
6. **Cambios.** Agregar un dato visible al público exige actualizar esta matriz.
