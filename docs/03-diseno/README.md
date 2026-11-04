# Diseño

| Campo | Valor |
|---|---|
| Estado | Aprobado |
| Responsable | Gabrieli Murillas Ramírez |
| Última revisión | 2026-11-04 |

## Fuentes de verdad

| Artefacto | Rol | Autoridad |
|---|---|---|
| [DESIGN.md](../../DESIGN.md) *(raíz)* | Sistema de diseño: tokens (frontmatter YAML) y reglas | **Normativo** para agentes y personas |
| [`.impeccable/design.json`](../../.impeccable/design.json) | Extensiones: rampas tonales, movimiento, fragmentos de componentes | Derivado de DESIGN.md; se regenera con él |
| `ecoruta-web/src/app/globals.css` | Tokens implementados (`@theme`) | Normativo en el código |
| `ecoruta-web/src/domain/colores.ts` | Paleta de cinco colores de ruta | Normativo en el código |
| [`diseno/`](../../diseno/README.md) | 11 maquetas `.dc.html` (5 del ciudadano y 6 del admin) | Referencia visual, no fuente de verdad |
| `diseno/recursos/` | Foto de identidad (los Morros) y sus recortes | Activo de marca |

Si cambia el sistema, se actualizan juntos DESIGN.md, `globals.css` y las maquetas afectadas, y
se regenera el archivo complementario con `/impeccable document`.

## Principios de experiencia

1. **Un vistazo, en la calle, con sol.** La cifra del tiempo estimado es lo más grande de la
   pantalla, en serif de alto contraste.
2. **El mapa es el contenido.** Nada decorativo compite con las líneas y los marcadores de ruta.
3. **Estados honestos.** Toda pantalla diseña su estado vacío, su estado de error y su estado
   «sin señal» antes que el estado feliz.
4. **Una sola explicación.** Las limitaciones (avisos solo con la página abierta) se explican una
   vez, no en cada visita.
5. **El color no habla solo.** Nombre e ícono acompañan siempre al color.

## Voz y tono

| Contexto | Regla | Ejemplo |
|---|---|---|
| Ciudadano | Tú, cercano y directo | «Tu bus llega en ~6 min» |
| Tiempo | Siempre «estimado», nunca «predictivo» | «Tiempo estimado» |
| Error | Qué pasó y qué hacer, sin culpar | «No pudimos ver tu ubicación. Actívala en los ajustes del navegador.» |
| Admin | Tú, preciso y operativo | «Unidad 12 sin señal hace 6 min» |
| Formato | Sentence case, sin TODO MAYÚSCULAS, español de Venezuela | — |

## Inventario de pantallas

| Superficie | Pantalla | Maqueta | Implementada |
|---|---|---|---|
| Ciudadano | Seguimiento (mi parada) | `usuario/Main` | ✅ |
| Ciudadano | Alerta de proximidad | `usuario/AlertaProximidad` | ✅ |
| Ciudadano | Sin unidades | `usuario/SinUnidades` | 🟡 |
| Ciudadano | Señal perdida | `usuario/SenalPerdida` | 🟡 |
| Ciudadano | Escritorio | `usuario/Escritorio` | 🟡 |
| Ciudadano | Detalle de ruta | `usuario/RutaDetalle` | ⬜ (CIU-16) |
| Ciudadano | Portada | — | ⬜ (CIU-15) |
| Admin | Ingreso | `admin/Ingreso` | ✅ |
| Admin | Monitoreo | `admin/Main` | ✅ |
| Admin | Editar ruta | `admin/RutaEditar` | ✅ |
| Admin | Unidades | `admin/Unidades` | ✅ |
| Admin | Parámetros | `admin/Parametros` | ✅ |
| Admin | Históricos | `admin/Historicos` | 🟡 |

## Fotografía de identidad

Una sola foto: el atardecer sobre los Morros de San Juan (foto propia; recortes en
`diseno/recursos/`).

- **Dónde va:** panel derecho del ingreso del admin (solo en escritorio), imagen Open Graph
  (`src/app/opengraph-image.jpg`), portada (`morros-panoramico-21x9.jpg`), bienvenida de la app
  y fondo del teléfono kiosco.
- **Dónde no:** mapas, monitoreo, tablas, alertas y estados vacíos. Su naranja se confundiría
  con colores de ruta o de estado.
- **Texto:** al lado de la foto o sobre una superficie sólida, nunca directamente encima.
- **Técnica:** importación estática con `next/image` (medidas y placeholder automáticos),
  AVIF/WebP desde `next.config.ts`, sin `preload` donde está oculta en móvil, y `alt=""` si es
  decorativa.

## App del dispositivo de ruta

Comparte paleta y tipografía, pero tiene su propio sistema documentado en su repositorio:
controles de 72 dp o más, tema oscuro y una excepción consciente con superficies de «cristal»
translúcido, decidida por la autora. No hereda la regla de «sin degradados» en la pantalla de
bienvenida.

## Herramientas

La skill **impeccable** está instalada en `~/.claude/skills/impeccable`. Comandos útiles:
`/impeccable critique <pantalla>`, `/impeccable audit <pantalla>` y
`/impeccable document` (para refrescar DESIGN.md).
