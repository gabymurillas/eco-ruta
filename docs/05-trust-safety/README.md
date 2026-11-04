# Trust & Safety

| Campo | Valor |
|---|---|
| Estado | Aprobado |
| Responsable | Gabrieli Murillas Ramírez |
| Última revisión | 2026-11-04 |

EcoRuta publica en vivo dónde están vehículos de servicio público. La confianza del ciudadano
depende de que los datos sean **correctos**, y la seguridad de los choferes depende de que sean
**acotados**. Esta sección define a quién protegemos, de qué, y qué hacemos cuando algo falla.

| Documento | Contenido |
|---|---|
| [modelo-de-amenazas.md](modelo-de-amenazas.md) | Activos, actores, amenazas (STRIDE) y controles |
| [politica-de-exposicion.md](politica-de-exposicion.md) | Qué dato ve quién y cuándo |
| [respuesta-a-incidentes.md](respuesta-a-incidentes.md) | Severidades y guías de actuación |
| [registro-de-brechas.md](registro-de-brechas.md) | Diferencias conocidas entre la política y la implementación |

## A quién protegemos

| Parte | Qué está en juego |
|---|---|
| **Choferes** | Su seguridad física: que la posición de la unidad no facilite robos o extorsión |
| **Ciudadanos** | Su ubicación y su confianza: que un tiempo estimado o un aviso falso no los haga perder el bus |
| **Ente gestor** | La integridad de su configuración y de su flota |
| **El sistema** | Telemetría auténtica: que nadie suplante a una unidad |

## Compromisos

1. Una unidad solo es visible al público mientras está en un viaje activo.
2. El sistema no guarda la identidad de los choferes ni los evalúa.
3. El ciudadano no tiene cuenta y su ubicación no se almacena.
4. Solo el teléfono vinculado a una unidad puede escribir su telemetría.
5. Un aviso de cada tipo por viaje y parada, garantizado por la base de datos.
6. El tiempo se declara siempre como estimado.
