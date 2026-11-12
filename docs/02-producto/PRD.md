# PRD — EcoRuta San Juan

**Documento de requisitos de producto**

| Campo | Valor |
|---|---|
| Estado | Aprobado para el alcance de la tesis |
| Versión | 1.1 |
| Responsable del producto | Gabrieli Murillas Ramírez (autora; equipo de una persona) |
| Última revisión | 2026-11-10 |
| Hito | Defensa del proyecto de grado (UNERG), antes del 31-12-2026; fecha exacta por confirmar |
| Fuentes | Entrevista de producto (2026-11-04) · `CLAUDE.md` · Análisis de factibilidad (julio de 2026) · código en `master` |
| Relacionados | [Visión](../01-vision/vision.md) · [PRODUCT.md](../../PRODUCT.md) · [DESIGN.md](../../DESIGN.md) · [Arquitectura](../04-arquitectura/README.md) · [Trust & Safety](../05-trust-safety/README.md) · [Legal](../06-legal/README.md) |

**Convenciones de este documento.** Prioridad: **P0** (sin esto no hay producto en la defensa),
**P1** (comprometido para la defensa), **P2** (deseable, puede caer) y **Futuro** (después de la
tesis). Estado: ✅ hecho · 🟡 en curso o parcial · ⬜ pendiente. Los requisitos tienen un ID
estable (`CIU-`, `ADM-`, `DIS-`, `SIS-`, `NFR-`) para trazarlos en commits, pruebas y tesis.

---

## Índice

1. [Resumen](#1-resumen)
2. [Problema y contexto](#2-problema-y-contexto)
3. [Objetivos y no-objetivos](#3-objetivos-y-no-objetivos)
4. [Usuarios y personas](#4-usuarios-y-personas)
5. [Recorridos principales](#5-recorridos-principales)
6. [Requisitos funcionales](#6-requisitos-funcionales)
7. [Requisitos no funcionales](#7-requisitos-no-funcionales)
8. [Métricas de éxito](#8-métricas-de-éxito)
9. [Plan de entrega](#9-plan-de-entrega)
10. [Dependencias](#10-dependencias)
11. [Riesgos](#11-riesgos)
12. [Decisiones abiertas](#12-decisiones-abiertas)
13. [Glosario](#13-glosario)
14. [Historial de cambios](#14-historial-de-cambios)

---

## 1. Resumen

EcoRuta San Juan es un sistema de monitoreo georreferenciado en tiempo real para los servicios
públicos que recorren San Juan de los Morros: **transporte público** (prioritario) y
**recolección de desechos** (segundo servicio). Cada unidad lleva un teléfono Android dedicado
que transmite su posición. El ciudadano abre una web sin cuenta, ve su parada más cercana, las
unidades que vienen, el tiempo estimado de llegada, y recibe avisos en pantalla cuando una unidad
**se acerca** y cuando **ya pasó**. El ente gestor configura y monitorea todo desde un panel web.

## 2. Problema y contexto

### 2.1 Problema

| Quién | Dolor | Hoy |
|---|---|---|
| Pasajero | No sabe si el bus ya pasó, si viene o si no sale | Espera a ciegas en la parada |
| Hogar | No sabe cuándo pasa el camión de aseo | Saca la basura antes (queda en la calle) o la pierde |
| Visitante | No conoce las rutas | Pregunta en la calle |
| Ente gestor | No ve su flota | Sin visibilidad; coordinación por teléfono |

La alternativa actual es **nada** o **grupos de WhatsApp** informales.

### 2.2 Contexto operativo

- Conectividad móvil intermitente y cortes eléctricos frecuentes.
- Teléfonos de gama baja con datos móviles caros; muchos sin Google Play Services.
- GPS de teléfono económico: deriva de 10 a 50 m.
- Sin presupuesto para hardware de rastreo; costos recurrentes sin financiamiento después de la
  tesis.
- Sin acuerdo formal con la alcaldía todavía.

### 2.3 Por qué ahora

El proyecto de grado exige una solución funcional y defendible antes de fin de 2026. La
revisión técnica de julio de 2026 identificó diez riesgos críticos; la arquitectura actual
responde a ellos (ver [§11](#11-riesgos) y [ADR](../04-arquitectura/adr/README.md)).

## 3. Objetivos y no-objetivos

### 3.1 Objetivos

| ID | Objetivo | Medido por |
|---|---|---|
| O1 | El ciudadano sabe cuándo llega su unidad | Precisión del tiempo estimado (M1, M2) |
| O2 | El ciudadano recibe avisos confiables | Avisos correctos, sin duplicados (M3–M5) |
| O3 | El ciudadano vuelve a usarlo | Adopción (M6, M7) |
| O4 | El ente gestor ve y configura su flota sin ayuda técnica | Tareas del admin completadas en la demostración (M8) |
| O5 | El sistema opera con conectividad degradada | Cobertura de transmisión (M9) |

### 3.2 No-objetivos (explícitamente fuera de alcance)

| No-objetivo | Motivo |
|---|---|
| Notificaciones push (FCM, Web Push) | Muchos teléfonos sin Google Play Services; el canal es la alerta en pantalla por Realtime. Limitación explicada al ciudadano |
| Cuentas de ciudadano, perfiles o favoritos en el servidor | Cero fricción; «mi parada» vive solo en el navegador |
| App para iOS | Descartado del proyecto |
| Pagos, cobro de pasaje o boletería | Fuera del problema |
| Elección manual de ruta o parada sin ubicación | **Decisión definitiva**: la ubicación es el único camino |
| Evaluación o ranking de choferes | El sistema no vigila personas (ver [Trust & Safety](../05-trust-safety/README.md)) |
| Varios entes en el admin (multiorganización) | Un solo ente basta para la tesis ([ADR-0014](../04-arquitectura/adr/0014-plataforma-multiorganizacion.md)). Sí hay dos roles dentro del ente: admin y operador (ADM-18, ADM-19) |
| Modelo predictivo con aprendizaje automático | Solo una versión mínima con historial por franja (CIU-09) |

## 4. Usuarios y personas

### P1 — Ana, pasajera diaria *(primaria)*
Trabaja en el centro y toma el bus a las 6:40 a. m. Usa un Android de gama baja con un plan de
datos pequeño. **Trabajo por hacer:** «Cuando llego a la parada, quiero saber si el bus viene o
ya pasó, para decidir si espero o camino.» **Frustración:** esperar 30 minutos para enterarse de
que la unidad no salió.

### P2 — Carmen, hogar que espera el aseo
Vive en una urbanización por donde el camión pasa sin horario fijo. **Trabajo por hacer:**
«Quiero saber cuándo se acerca el camión, para sacar la basura justo a tiempo.»

### P3 — Luis, estudiante foráneo de la UNERG
No conoce la ciudad. **Trabajo por hacer:** «Quiero saber qué rutas pasan por la parada más
cercana y cuándo llegan.»

### P4 — Personal de la alcaldía *(administrador y operador)*
Trabaja en escritorio. El **administrador** configura rutas, paradas y unidades, vincula los
teléfonos y decide quién entra al panel. El **operador** vigila la flota y atiende las
incidencias, sin poder cambiar la configuración. **Trabajo por hacer:** «Quiero ver qué
unidades están en servicio, cuáles perdieron señal y qué incidencias hay.»

### P5 — Chofer *(usuario indirecto)*
No tiene cuenta. Interactúa con el teléfono de la unidad: iniciar, finalizar y reportar
incidencias. **Restricción:** no puede distraerse manejando; controles de 72 dp o más.

## 5. Recorridos principales

**R1 — Primera visita del ciudadano.** Abre el enlace → bienvenida → concede la ubicación → ve la
parada más cercana preseleccionada (puede cambiarla entre las cercanas) → ve las rutas que pasan,
las unidades en camino y el tiempo estimado → se le explica una vez que los avisos solo llegan con
la página abierta.

**R2 — Visita recurrente.** Abre → «mi parada» se recuerda en el navegador → ve las llegadas →
recibe «se acerca» (unos 500 m antes) y «ya pasó».

**R3 — Sin ubicación.** El ciudadano niega la ubicación o el dispositivo no la tiene → mensaje
claro de por qué hace falta y cómo activarla. No hay elección manual.

**R4 — Sin paradas cerca.** No hay paradas a 1,5 km → se muestra la más cercana y a qué distancia
está.

**R5 — Alta de una ruta (admin).** Crear ruta (nombre, tipo libre, color de cinco, ícono,
horario) → trazar con puntos clave ruteados por las calles o desde un viaje grabado → las
paradas que toca el trazado se asocian solas.

**R6 — Puesta en servicio de una unidad.** Crear unidad → asignar ruta → «Vincular» genera un
código de 5 caracteres válido por 10 minutos → el teléfono lo canjea → la unidad aparece en el
monitoreo.

**R7 — Un viaje.** El chofer pulsa «iniciar» → el teléfono transmite cada 5 s en movimiento y
cada 30 s detenido, y guarda en un buffer offline sin red → el servidor evalúa geocercas y emite
avisos → el chofer pulsa «finalizar».

**R8 — Teléfono perdido o robado.** El admin elimina (o, en el futuro, desvincula) la unidad → se
revoca la sesión del teléfono.

## 6. Requisitos funcionales

### 6.1 Web del ciudadano (`CIU`)

| ID | Requisito | Prioridad | Estado |
|---|---|---|---|
| CIU-01 | Acceso sin cuenta ni instalación desde cualquier navegador móvil | P0 | ✅ |
| CIU-02 | Detectar la ubicación y preseleccionar la parada más cercana; permitir cambiar entre las cercanas | P0 | ✅ |
| CIU-03 | Recordar «mi parada» solo en el navegador (`localStorage`); funcionar igual si el almacenamiento está bloqueado | P0 | ✅ |
| CIU-04 | Mostrar las rutas que pasan por la parada, con chip de color **y** nombre | P0 | ✅ |
| CIU-05 | Mostrar las unidades en camino y su tiempo estimado, rotulado siempre como «estimado» | P0 | ✅ (desde 2026-11-05: antes la lista decía «En camino» sin cifra) |
| CIU-06 | Aviso «se acerca» cuando una unidad entra a `radio_aproximacion_m` (500 m) de mi parada, una sola vez por viaje | P0 | ✅ (falta prueba de punta a punta con un recorrido real) |
| CIU-07 | Aviso «ya pasó» tras la salida confirmada por histéresis, una sola vez por viaje | P0 | ✅ (ídem) |
| CIU-08 | Explicar una vez las limitaciones (avisos solo con la página abierta) | P0 | ✅ |
| CIU-09 | **Tiempo estimado con historial (versión mínima):** usar la velocidad típica de la ruta en esa franja horaria cuando haya suficientes viajes; si no, el cálculo simple. Ver [ADR-0011](../04-arquitectura/adr/0011-eta-estimado-con-historial.md) | P1 | ⬜ |
| CIU-10 | Mostrar el estado «sin señal» de una unidad, atenuada y sin halo | P0 | 🟡 (hecho en la lista y en el mapa: «Sin confirmar», última posición y marcador atenuado sin halo; falta verlo con una unidad real) |
| CIU-11 | Indicar cuando una incidencia activa afecta el tiempo estimado | P1 | ✅ (margen `penalizacion_incidencia_pct` y aviso en la fila) |
| CIU-12 | Sin ubicación: mensaje explicativo, sin elección manual | P0 | ✅ |
| CIU-13 | Sin paradas a 1,5 km: mostrar la más cercana y su distancia | P1 | ✅ |
| CIU-14 | Estado vacío: no hay unidades en servicio en mi parada | P0 | 🟡 (hecho: mensaje y horario de cada ruta de la parada; «última unidad vista» de la maqueta queda fuera por TS-01, el público no lee viajes cerrados; falta verlo con una parada con rutas) |
| CIU-15 | **Portada (landing)** con la foto de los Morros: qué es, cómo funciona y botón para ver mi parada | P1 | ⬜ |
| CIU-16 | **Detalle de ruta** `/ruta/[id]`: trazado, paradas, unidades en vivo y horario | P1 | ⬜ (maqueta `RutaDetalle`) |
| CIU-17 | Vista previa al compartir (Open Graph) | P2 | ✅ |
| CIU-18 | Mostrar al público solo unidades en viaje activo; sin recorridos pasados | P0 | ✅ (cierra TS-01; `sql/13`) |

### 6.2 Web de administración (`ADM`)

| ID | Requisito | Prioridad | Estado |
|---|---|---|---|
| ADM-01 | Ingreso con correo y contraseña; guardia de sesión en `/admin`; «Mantener la sesión» (desmarcado, termina al cerrar el navegador) y recuperación de contraseña por enlace al correo | P0 | ✅ (la recuperación exige la URL de retorno en la lista de Supabase Auth) |
| ADM-02 | Monitoreo en vivo de la flota por Realtime, sin recargar | P0 | ✅ |
| ADM-03 | Tarjeta de unidad: nombre, ruta, velocidad, última señal y batería; borde ámbar con batería baja y rojo sin señal | P0 | ✅ |
| ADM-04 | Incidencias activas visibles en el monitoreo | P0 | ✅ |
| ADM-05 | CRUD de rutas: nombre, tipo libre, color de la paleta de cinco, ícono, horario y activa | P0 | ✅ |
| ADM-06 | Trazado asistido: puntos clave ruteados por las calles (OSRM), tramos rectos y trazado desde un viaje grabado | P0 | ✅ |
| ADM-07 | Paradas de la ciudad: crear, mover (también por coordenadas) y buscar lugares; radio de geocerca; avisos al ciudadano por parada | P0 | ✅ |
| ADM-08 | Asociación automática parada–ruta por cercanía al trazado (`distancia_parada_trazado_m`) | P0 | ✅ |
| ADM-09 | CRUD de unidades y asignación de ruta | P0 | ✅ |
| ADM-10 | Vinculación: código de 5 caracteres, de un solo uso y válido por 10 minutos | P0 | ✅ |
| ADM-11 | Eliminar una unidad revoca la cuenta del teléfono | P0 | ✅ |
| ADM-12 | Desvincular el teléfono sin borrar la unidad ni su historial | P1 | ⬜ (brecha TS-04) |
| ADM-13 | Editar los parámetros calibrables desde la interfaz | P0 | ✅ |
| ADM-14 | Históricos: viajes completados, cobertura e incidencias en los últimos 7 o 30 días; viajes por día; resumen por ruta | P1 | ✅ |
| ADM-15 | Históricos: velocidad típica por ruta y franja (insumo de CIU-09) | P1 | ⬜ |
| ADM-16 | Ver el recorrido real de un viaje y sus desvíos sobre el trazado | P2 | ⬜ |
| ADM-17 | Resolver (cerrar) incidencias | P1 | 🟡 (sección `/admin/incidencias` hecha; falta probarla con un reporte real) |
| ADM-18 | Equipo: invitar por correo con un rol, listar las cuentas del panel (rol, último ingreso, invitación pendiente), cambiar el rol y quitar el acceso. Solo un admin; nadie se modifica a sí mismo; siempre queda un admin | P1 | 🟡 (código listo; falta aplicar `sql/17`, desplegar `gestionar-equipo` y configurar la plantilla de invitación: [arquitectura § 7](../04-arquitectura/README.md#7-configurar-supabase-para-el-equipo-del-panel)) |
| ADM-19 | Rol operador: monitoreo, históricos y lectura de rutas, paradas y unidades; resuelve incidencias; no crea, edita ni borra nada más. Lo impone RLS, no solo la interfaz | P1 | 🟡 (ídem ADM-18) |

### 6.3 App del dispositivo de ruta (`DIS`) — repositorio aparte

| ID | Requisito | Prioridad | Estado |
|---|---|---|---|
| DIS-01 | Vinculación por código; tokens cifrados con Android Keystore | P0 | ✅ |
| DIS-02 | Dos acciones del chofer: iniciar y finalizar el recorrido | P0 | ✅ |
| DIS-03 | Reportar incidencia (calle cerrada, falla mecánica, desvío, congestión u otro con texto) | P0 | ✅ |
| DIS-04 | Transmisión adaptativa: `emision_movimiento_s` / `emision_detenido_s` desde `parametros` | P0 | ✅ |
| DIS-05 | Buffer offline (Room), de hasta 2 h, que se entrega completo al volver la red | P0 | ✅ |
| DIS-06 | Latido de salud (batería) aunque no haya viaje | P0 | ✅ |
| DIS-07 | Modo kiosco, arranque automático y servicio en primer plano resiliente | P0 | ✅ |
| DIS-08 | Vinculación por QR | P2 | ⬜ |

### 6.4 Sistema y backend (`SIS`)

| ID | Requisito | Prioridad | Estado |
|---|---|---|---|
| SIS-01 | Evaluación de geocercas en el servidor, en 5 pasos (filtro, suavizado, detección, permanencia e histéresis) | P0 | ✅ |
| SIS-02 | Garantía de un solo aviso por viaje, parada y tipo, a nivel de base de datos | P0 | ✅ |
| SIS-03 | Tiempo estimado sobre el trazado real (`ST_LineLocatePoint` + `ST_LineSubstring`) | P0 | ✅ |
| SIS-04 | Todo valor calibrable en `parametros` | P0 | ✅ |
| SIS-05 | RLS activo en todas las tablas | P0 | ✅ |
| SIS-06 | Retención: borrar posiciones crudas con más de 90 días, tras agregarlas | P1 | ⬜ (brecha TS-02) |
| SIS-07 | Simulador de viajes para pruebas sin vehículo | P1 | ✅ |
| SIS-08 | Prueba de campo de precisión GPS y calibración de parámetros | P0 | ⬜ |

## 7. Requisitos no funcionales

| ID | Categoría | Requisito |
|---|---|---|
| NFR-01 | Rendimiento | La web del ciudadano es usable en 3G y en teléfonos de gama baja: mapa ligero (Leaflet), sin dependencias pesadas |
| NFR-02 | Latencia | Una posición recibida se refleja en las webs en menos de 5 s (Realtime) |
| NFR-03 | Resiliencia | Ninguna posición se pierde por falta de red mientras el buffer del dispositivo tenga menos de 2 h |
| NFR-04 | Consumo de datos | El dispositivo emite cada 5 s en movimiento y cada 30 s detenido; ajustable sin publicar un APK nuevo |
| NFR-05 | Accesibilidad | WCAG 2.2 AA; 48 px táctiles; el color nunca es el único portador de significado; `prefers-reduced-motion` |
| NFR-06 | Seguridad | RLS en todo; `service_role` nunca en el cliente; claims solo en `app_metadata` |
| NFR-07 | Privacidad | Sin cuentas de ciudadano; ubicación sin almacenar; unidades visibles solo en servicio ([política](../05-trust-safety/politica-de-exposicion.md)) |
| NFR-08 | Idioma | Toda la interfaz en español, tuteo, sentence case |
| NFR-09 | Mantenibilidad | Capas `app → features → services → lib`; `domain` puro; archivos de 600 líneas como máximo |
| NFR-10 | Costo | Opera en los planes gratuitos de Supabase y Vercel durante la tesis |
| NFR-11 | Honestidad | Nunca se usa «predictivo» en la interfaz; siempre «tiempo estimado» |

## 8. Métricas de éxito

> Las metas son **propuestas** para validar en la prueba de campo. Ninguna tiene todavía una
> medición real: no hay viajes reales grabados al 2026-11-04.

| ID | Métrica | Definición | Meta propuesta | Cómo se mide |
|---|---|---|---|---|
| M1 | Error del tiempo estimado | Mediana de \|llegada real − tiempo estimado\| para estimaciones de ≤ 10 min | ≤ 2 min | Comparación de tiempos estimados registrados contra los avisos «ya pasó» en la prueba de campo |
| M2 | Mejora con historial | M1 con historial frente a M1 simple | No peor que el simple; idealmente −20 % | Contraste sobre los mismos viajes (CIU-09) |
| M3 | Avisos duplicados | Avisos repetidos por (viaje, parada, tipo) | 0 (garantizado por restricción) | `unique` en `avisos_parada` |
| M4 | Falsos «se acerca» | Avisos emitidos para unidades que no llegaron a la parada | ≤ 5 % | Auditoría de viajes de prueba |
| M5 | Anticipación de «se acerca» | Tiempo entre el aviso y el paso real | ≥ 1 min en el 90 % de los casos | Diferencia entre `acercandose` y `paso` |
| M6 | Visitas | Visitantes únicos semanales en la web pública | Línea base en el piloto | Analítica sin cookies (decisión abierta D3) |
| M7 | Recurrencia | % de visitantes que vuelven en 7 días | Línea base en el piloto | Ídem |
| M8 | Autonomía del admin | Tareas R5 y R6 completadas sin ayuda en la demostración | 100 % | Prueba con un usuario de la alcaldía |
| M9 | Cobertura de transmisión | % del tiempo de viaje con posiciones usables | ≥ 90 % | `resumen_historicos.cobertura_pct` |

## 9. Plan de entrega

| Hito | Contenido | Requisitos | Meta |
|---|---|---|---|
| H1.1 Transmisión de punta a punta | App, buffer y avisos con recorrido simulado sobre una ruta con paradas en su trazado | CIU-06/07, DIS-04/05 | Noviembre de 2026, semana 2 |
| H1.2 Prueba de campo de GPS | Recorrido real; calibrar `exactitud_maxima_m`, radios, permanencia e histéresis | SIS-08 | Noviembre de 2026, semana 3 |
| H1.3 Confianza y datos | Visibilidad solo en servicio, retención de 90 días, desvincular | CIU-18, SIS-06, ADM-12 | Noviembre de 2026, semana 3 |
| H1.4 Historial | Agregado de velocidad por franja y tiempo estimado con historial | ADM-15, CIU-09 | Noviembre de 2026, semana 4 |
| H1.5 Superficies públicas | Portada y detalle de ruta | CIU-15, CIU-16 | Diciembre de 2026, semana 1 |
| H1.6 Congelamiento | Pulido, accesibilidad, documentación y anexos de la tesis | NFR-05 | Diciembre de 2026, semana 2 |
| **Defensa** | — | — | Antes del 31-12-2026 |

Orden de corte si falta tiempo: primero caen los P2, después CIU-16, CIU-15 y ADM-16. CIU-09
se conserva por decisión de la autora; si no hay datos suficientes, se defiende con el respaldo
al cálculo simple.

## 10. Dependencias

| Dependencia | Uso | Riesgo |
|---|---|---|
| Supabase (plan gratuito) | Postgres + PostGIS, Auth, Realtime y Edge Functions | Pausa por inactividad; límites |
| Vercel (plan gratuito) | Hospedaje de la web | Límites del plan Hobby |
| Teselas de OpenStreetMap | Mapa base | Política de uso justo; no apto para volumen alto |
| Photon (Komoot) | Buscador de lugares del admin | Servicio público sin garantías |
| OSRM público | Ruteo del trazado asistido | Servidor de demostración; sin garantías |
| Teléfono Android por unidad | Baliza GPS | Costo de equipo y de datos móviles. **Requiere Google Play Services** (la app usa `play-services-location`); al comprar equipos hay que verificarlo |
| Alcaldía | Operación real | Sin acuerdo formal |

## 11. Riesgos

| ID | Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|---|
| R1 | Precisión GPS insuficiente | Media | Alto | Filtro, suavizado, permanencia e histéresis; prueba de campo; `parametros` |
| R2 | Sin datos reales antes de la defensa | Alta | Alto (CIU-09, métricas) | Simulador; prueba de campo planificada; respaldo al cálculo simple |
| R3 | Sin respaldo institucional | Alta | Alto en H2 | Demostración y documentación para la alcaldía |
| R4 | Costos recurrentes sin financiamiento | Alta | Medio | Planes gratuitos; alternativa de autoalojamiento documentada |
| R5 | Exposición de unidades o choferes | Media | Alto | Política de exposición; RLS limitada a viajes abiertos (TS-01 cerrada) |
| R6 | Bloqueo por servicios públicos de terceros (OSM, OSRM, Photon) | Baja | Medio | Volumen bajo; URLs configurables |
| R7 | Avisos limitados a la página abierta | Cierta | Medio | Explicación al ciudadano; push como trabajo futuro |
| R8 | El chofer no inicia o no finaliza el viaje | Media | Alto | Dos botones; latido; monitoreo de unidades caídas |

## 12. Decisiones abiertas

| ID | Pregunta | Dueña | Fecha límite |
|---|---|---|---|
| D1 | Fecha exacta de la defensa | Autora | Por confirmar |
| D2 | Continuidad después de la tesis (piloto, réplica o cierre) | Autora y alcaldía | Después de la defensa |
| D3 | Analítica de adopción: herramienta sin cookies (por ejemplo, Vercel Web Analytics) o ninguna | Autora | H1.5 |
| D4 | Umbral mínimo de viajes por franja para usar el historial | Autora | H1.4 (como parámetro) |
| D5 | Plan de sostenibilidad de costos | Autora | H2 |
| D6 | Verificar el reglamento de la UNERG sobre titularidad de los trabajos de grado | Autora | Antes de la defensa |

## 13. Glosario

| Término | Definición |
|---|---|
| Unidad | Vehículo (bus, camión) que presta un servicio |
| Ruta | Recorrido con trazado, tipo de servicio, color e ícono |
| Parada | Punto de la ciudad con radio de geocerca; no pertenece a una ruta |
| Viaje | Un recorrido de una unidad, de «iniciar» a «finalizar» |
| Dispositivo | Teléfono dedicado vinculado a una unidad |
| Geocerca | Círculo alrededor de una parada usado para detectar el paso de una unidad |
| Tiempo estimado (ETA estimado) | Tiempo que falta para que una unidad llegue a una parada: distancia sobre el trazado ÷ velocidad de referencia. Nunca «predictivo» |
| Permanencia | Tiempo mínimo dentro de la geocerca antes de darla por válida |
| Histéresis | Tiempo continuo fuera de la geocerca antes de confirmar la salida |
| Ente gestor | Institución que opera el sistema (objetivo: la alcaldía) |

## 14. Historial de cambios

| Versión | Fecha | Cambio |
|---|---|---|
| 1.1 | 2026-11-10 | Roles del panel: se agregan ADM-18 (Equipo) y ADM-19 (rol operador); «roles múltiples» sale de los no-objetivos ([ADR-0015](../04-arquitectura/adr/0015-roles-del-panel-y-equipo.md)) |
| 1.0 | 2026-11-04 | Primera versión, a partir de la entrevista de producto. Incorpora el tiempo estimado con historial (versión mínima) al alcance de la tesis; antes era trabajo futuro |
