# Política de exposición de datos

| Campo | Valor |
|---|---|
| Estado | Aprobada (2026-11-04) |
| Decisión técnica | [ADR-0012](../04-arquitectura/adr/0012-visibilidad-solo-en-servicio.md), [ADR-0013](../04-arquitectura/adr/0013-retencion-de-telemetria.md) |

## Regla general

> **El público ve lo necesario para esperar una unidad, y nada más.**

## Matriz de visibilidad

| Dato | Público (ciudadano) | Dispositivo | Operador | Admin |
|---|---|---|---|---|
| Rutas activas: trazado, color, ícono, horario | ✅ | ✅ | ✅ (también inactivas) | ✅ |
| Paradas | ✅ | ✅ | ✅ | ✅ |
| Nombre de la unidad y su ruta | ✅ | Solo la suya | ✅ | ✅ |
| Posición en vivo | ✅ **solo durante un viaje activo** | Solo la suya (escritura) | ✅ | ✅ |
| Recorridos de viajes terminados | ❌ | ❌ | ✅ (90 días) | ✅ (90 días) |
| Viajes abiertos (en servicio o no) | ✅ | Solo los suyos | ✅ | ✅ |
| Avisos «se acerca» y «ya pasó» | ✅ | — | ✅ | ✅ |
| Incidencias activas: tipo y ruta | ✅ | Inserta las suyas | ✅; las resuelve | ✅ |
| Texto libre de incidencias | ❌ (objetivo; hoy ✅, TS-03) | Inserta | ✅ (lectura) | ✅ |
| Batería y última señal del teléfono | ❌ | Escribe | ✅ | ✅ |
| Identidad del chofer | **No existe en el sistema** | — | — | — |
| Ubicación del ciudadano | Solo en su navegador | — | ❌ | ❌ |
| Parámetros calibrables | ✅ (lectura) | ✅ (lectura) | ✅ (lectura) | ✅ |
| Código de vinculación de un teléfono | ❌ | ❌ | ❌ | ✅ |
| Cuentas del panel (correo, rol, último ingreso) | ❌ | ❌ | ❌ | ✅ (por `gestionar-equipo`) |

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
   - **«Cómo llegar» (CIU-21):** solo cuando el ciudadano lo toca, su posición y la de la parada
     pasan por una Server Action de EcoRuta hacia openrouteservice (HeiGIT, Alemania) para
     calcular el camino a pie. EcoRuta no la guarda; HeiGIT la procesa según su propia política.
     La acción rechaza puntos a más de 25 km del centro de San Juan o a más de 6 km entre sí.
   - **Ubicación en vivo (CIU-19):** con el permiso ya concedido, el punto azul se actualiza con
     `watchPosition` dentro del navegador; esas posiciones no se envían a ningún servidor.
6. **Cambios.** Agregar un dato visible al público exige actualizar esta matriz.
