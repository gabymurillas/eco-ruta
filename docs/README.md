# Documentación — EcoRuta San Juan

Sistema de monitoreo georreferenciado en tiempo real para rutas de transporte público y
recolección de desechos en San Juan de los Morros, Venezuela. Proyecto de grado de la UNERG,
Ingeniería en Informática.

**`docs/` es la fuente de verdad del proyecto.** `CLAUDE.md` solo contiene las reglas operativas
para agentes de IA y enlaza aquí.

## Mapa

| Sección | Documento | Para qué sirve | Lector principal |
|---|---|---|---|
| **01 · Visión** | [vision.md](01-vision/vision.md) | Por qué existe EcoRuta, sus pilares y su horizonte | Jurado, alcaldía |
| **02 · Producto** | [PRD.md](02-producto/PRD.md) | Requisitos, métricas, plan de entrega y riesgos | Todos |
| | [PRODUCT.md](../PRODUCT.md) *(raíz)* | Verdad durable del producto, para agentes | Agentes de IA |
| **03 · Diseño** | [README.md](03-diseno/README.md) | Principios de experiencia, voz y tono, inventario de pantallas | Diseño, desarrollo |
| | [DESIGN.md](../DESIGN.md) *(raíz)* | Sistema de diseño normativo (tokens y reglas) | Agentes, desarrollo |
| **04 · Arquitectura** | [README.md](04-arquitectura/README.md) | Contexto, contenedores, flujos y despliegue | Desarrollo, jurado |
| | [modelo-de-datos.md](04-arquitectura/modelo-de-datos.md) | Tablas, invariantes, RLS y funciones | Desarrollo |
| | [geocercas-avisos-y-eta.md](04-arquitectura/geocercas-avisos-y-eta.md) | Algoritmo crítico | Desarrollo, jurado |
| | [adr/](04-arquitectura/adr/README.md) | 13 decisiones de arquitectura | Desarrollo, jurado |
| | [contrato-vinculacion.md](contrato-vinculacion.md) | Frontera con la app Android | Desarrollo de la app |
| **05 · Trust & Safety** | [README.md](05-trust-safety/README.md) | Compromisos y a quién protegemos | Todos |
| | [modelo-de-amenazas.md](05-trust-safety/modelo-de-amenazas.md) | STRIDE y controles | Desarrollo, jurado |
| | [politica-de-exposicion.md](05-trust-safety/politica-de-exposicion.md) | Qué dato ve quién | Todos |
| | [respuesta-a-incidentes.md](05-trust-safety/respuesta-a-incidentes.md) | Severidades y guías | Operación |
| | [registro-de-brechas.md](05-trust-safety/registro-de-brechas.md) | Diferencias conocidas entre política y código | Desarrollo |
| **06 · Legal** | [README.md](06-legal/README.md) | Marco venezolano y aviso de borrador | Alcaldía, jurado |
| | [privacidad.md](06-legal/privacidad.md) · [terminos-de-uso.md](06-legal/terminos-de-uso.md) | Textos para el ciudadano | Ciudadanos |
| | [licencias-y-atribuciones.md](06-legal/licencias-y-atribuciones.md) · [propiedad-intelectual.md](06-legal/propiedad-intelectual.md) | Licencias y titularidad | Jurado, alcaldía |

## Convenciones

- **Idioma:** español. Sentence case. «Tiempo estimado», nunca «predictivo».
- **Encabezado:** cada documento abre con una tabla de estado, versión o fecha y responsable.
- **Estados:** Borrador → Aprobado → Obsoleto. Las decisiones técnicas van en un ADR; un ADR
  aceptado se reemplaza con otro, no se edita.
- **IDs estables:** requisitos (`CIU-`, `ADM-`, `DIS-`, `SIS-`, `NFR-`), brechas (`TS-`),
  decisiones (`ADR-`) y decisiones abiertas (`D`). Se citan en commits: `[CIU-09] …`.
- **Autoridad:** el SQL de `sql/` manda sobre el modelo de datos documentado; el PRD manda sobre
  PRODUCT.md; DESIGN.md y `globals.css` mandan sobre las maquetas.
- **Actualización:** un cambio de comportamiento actualiza su documento en el mismo commit.

## Fuera de este repositorio

La arquitectura interna de la app Android la documenta su propio repositorio (`eco-ruta-app`,
README de arquitectura). Aquí se documentan su producto, su contrato y su seguridad.
