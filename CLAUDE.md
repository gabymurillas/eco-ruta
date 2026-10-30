# EcoRuta San Juan

Sistema de monitoreo georreferenciado en tiempo real para rutas de transporte público y
recolección de desechos en San Juan de los Morros, Venezuela.

Proyecto de grado — UNERG, Ingeniería en Informática.

---

## Qué resuelve

Los ciudadanos no tienen forma de saber dónde está su unidad de transporte ni cuándo pasa el
camión de aseo. El sistema transmite la posición de cada vehículo en vivo, calcula un tiempo
estimado de llegada y notifica por proximidad.

---

## Arquitectura: tres superficies, un backend

| Superficie | Quién la usa | Tecnología | Requiere login |
|---|---|---|---|
| **Web del usuario** | Cualquier ciudadano | Next.js (rutas públicas) | No |
| **Web de administración** | Ente gestor (alcaldía, cooperativa) | Next.js (`/admin`) | Sí |
| **App de la ruta** | Teléfono dedicado en el vehículo | Android nativo (Kotlin + Compose) | Vinculación única |
| **Backend** | — | Supabase (PostgreSQL + PostGIS) | — |

**La web de administración NO es el backend.** Es otra interfaz cliente. El backend es Supabase.

**La app de la ruta no vive en este repositorio.** Está en `C:\Users\usuario\EcoRutaDispositivo`,
como proyecto Android aparte, y la trabaja otra sesión. Lo único que comparte con este repo es el
backend y el contrato de `docs/contrato-vinculacion.md`. Si necesitas cambiar algo que la app
consume —una función, una política de RLS, la respuesta de una Edge Function—, se cambia aquí y
se anuncia allá; nunca al revés.

### Decisión de arquitectura clave: el dispositivo pertenece a la ruta

La "app del conductor" **no se instala en el teléfono personal de cada chofer**. Es un teléfono
barato dedicado que vive dentro del vehículo, conectado permanentemente al sistema eléctrico del
mismo, en modo kiosco. Pertenece a la ruta, no a una persona. Sustituye la compra de hardware
GPS por unidad.

Consecuencias que afectan al código:
- No hay gestión de cuentas de conductores. El dispositivo se vincula una vez a una unidad.
- La batería no es un riesgo crítico (va enchufado), pero el consumo de datos móviles sí importa.
- La interacción del chofer se limita a dos botones: iniciar y finalizar recorrido.

### Decisión de arquitectura clave: geocercas en el servidor

El geofencing se evalúa **en el servidor, contra la posición de la unidad**, nunca contra la
posición del ciudadano. El ciudadano no instala nada y no ejecuta procesos en segundo plano.

Esto significa: no hay límite de ~100 geocercas por cliente, no hay polling adicional, y el
canal principal de notificación es la alerta en pantalla vía Realtime (no push).

---

## Estructura del repositorio

```
ecoruta/
├── CLAUDE.md            ← este archivo
├── sql/
│   ├── 01_schema.sql
│   ├── 02_parametros.sql
│   ├── 03_rls.sql
│   ├── 04_funciones.sql          ← consultas (security invoker)
│   ├── 05_consultas_historicos.sql
│   ├── 06_vinculacion.sql        ← canje del código (security definer)
│   ├── 07_geocercas.sql          ← soporte PostGIS de la evaluación
│   └── 08_incidencia_otro.sql    ← tipo 'otro': observación libre del conductor
├── supabase/functions/
│   ├── _dominio/                 ← reglas puras: telemetría y geocercas
│   ├── vincular-dispositivo/     ← canje del código
│   └── registrar-posicion/       ← telemetría + evaluación de geocercas
├── docs/
│   └── contrato-vinculacion.md   ← frontera web ↔ app
└── ecoruta-web/         ← Next.js: usuario (público) + admin (/admin)
```

La app de la ruta **no está aquí**: es un proyecto Android independiente, fuera de este
repositorio. Comparten backend, no código.

> Hubo un `ecoruta-ruta/` con un scaffold de Expo. Se eliminó al cambiar la app a Android
> nativo: era boilerplate sin tocar, y dejarlo solo servía para que alguien lo confundiera con
> el proyecto real. Está en el historial, en el commit `690633e`.

---

## Stack

**Web (`ecoruta-web/`)**
- Next.js App Router + TypeScript + Tailwind CSS
- `@supabase/supabase-js` + `@supabase/ssr` (sesión en cookies, con Realtime)
- `react-leaflet` sobre Leaflet, con teselas de OpenStreetMap
- Deploy: Vercel

> Se descartó Mapbox GL: exige clave y cuenta, pesa ~230 KB contra ~42 KB de Leaflet
> —lo que importa en un teléfono de gama baja con datos móviles— y no tiene primitiva
> de círculo con radio en metros, que es justo lo que necesitan las geocercas. El
> servidor público de teselas de OSM es para volumen bajo: si el sistema se despliega
> para toda la ciudad, se apunta a un proveedor con atribución cambiando una URL.

**App de la ruta — proyecto aparte, fuera de este repositorio**
- Android nativo: Kotlin + Jetpack Compose. **Solo Android**; iOS está descartado del proyecto.
- GPS en segundo plano vía foreground service; el equipo va enchufado y en modo kiosco.
- Los tokens de sesión se cifran con Android Keystore.
- Se autentica canjeando un código: ver `docs/contrato-vinculacion.md`.

> Se descartó Expo/React Native, que era el plan original. La app es un proceso de GPS en
> segundo plano que debe sobrevivir a la gestión agresiva de batería de Android y a teléfonos
> de gama baja; eso se controla mejor desde el SDK nativo que a través de una capa de
> abstracción. El costo del cambio fue tirar un scaffold sin código propio.
>
> Su arquitectura interna la documenta el propio proyecto Android, no este archivo. Aquí solo
> se describe lo que la app consume del backend.

**Backend (Supabase)**
- PostgreSQL 15 + **PostGIS 3.3**
- Auth (solo admins y dispositivos; el ciudadano no se autentica)
- Realtime → posición en vivo
- Edge Functions (TypeScript/Deno) → ETA y evaluación de geocercas
- Row Level Security

> El documento original de tesis mencionaba Express.js. Se sustituyó por Edge Functions: cumplen
> el mismo rol de capa backend en TypeScript sin infraestructura adicional.

---

## Modelo de datos

Nueve tablas. El esquema autoritativo está en `sql/01_schema.sql` — **léelo antes de escribir
cualquier consulta**.

| Tabla | Rol |
|---|---|
| `rutas` | Recorrido, tipo de servicio, color, trazado (LineString) |
| `paradas` | Puntos de la ruta + radio de geocerca |
| `unidades` | Vehículos. Su servicio lo define la ruta a la que pertenecen |
| `dispositivos` | Teléfono-baliza vinculado a una unidad; salud del equipo |
| `viajes` | Un recorrido, de "iniciar" a "finalizar" |
| `posiciones` | Telemetría GPS. Tabla de alta escritura |
| `eventos_geocerca` | Control anti-spam de notificaciones |
| `incidencias` | Eventos reportados (calle cerrada, desvío, etc.) |
| `parametros` | Valores calibrables del sistema |

### Reglas del modelo que no se negocian

- Toda columna geográfica es `geography(Point|LineString, 4326)` y **lleva índice GiST**. Sin él,
  `ST_DWithin` recorre la tabla completa.
- Los valores calibrables (permanencia mínima, umbral de exactitud, intervalos de emisión) viven
  en la tabla `parametros`, **nunca hardcodeados**. Se ajustan tras la prueba de campo de GPS.
- `eventos_geocerca` tiene `unique (viaje_id, parada_id)`. Esa restricción es la garantía final
  contra notificaciones duplicadas: aunque la lógica fallara, la base de datos la rechaza.
- `rutas.tipo` es **texto libre a propósito**. El ente gestor registra el servicio que sea
  (transporte, aseo, agua, gas) sin que haya que tocar el esquema. La unidad no declara su tipo:
  lo hereda de su ruta.
- `rutas.icono` lo elige el admin al crear la ruta, junto al color. Como el tipo es libre, la
  interfaz no puede deducir el ícono: se elige explícitamente. Valores reconocidos hoy: `bus`,
  `camion`, `cisterna`, `van`, `generico`. Un valor nulo o desconocido cae al marcador genérico,
  así que agregar un ícono nuevo no rompe nada ni exige una migración.

---

## Lógica crítica: evaluación de geocercas

Vive en la Edge Function `registrar-posicion`, que es por donde la app entrega su telemetría:
guardar y evaluar ocurren en la misma llamada. **No la simplifiques.** Cada paso responde a un
problema real detectado en la revisión técnica del proyecto.

> Se descartó dispararla con un webhook de `pg_net` sobre el insert: es asíncrono y sin
> reintento, así que un fallo de la evaluación no le llega a nadie —y el producto de este
> sistema son las notificaciones—, además de exigir un secreto guardado en la base. También se
> descartó un trigger en PL/pgSQL, que habría llevado la lógica crítica a SQL. Así es síncrono
> y el fallo vuelve a la app, que reintenta desde su buffer offline.
>
> Las reglas puras viven en `supabase/functions/_dominio/`: `telemetria.ts` (filtro de calidad
> y suavizado) y `geocerca.ts` (permanencia e histéresis). Sin dependencias, para poder leerlas
> y defenderlas sueltas.

```
1. FILTRO DE CALIDAD
   si exactitud_m > exactitud_maxima_m → guardar con usable=false y TERMINAR
   (no se evalúan geocercas con una lectura mala)

2. SUAVIZADO
   media ponderada de las últimas 3 posiciones usables

3. DETECTAR PARADAS CERCANAS
   ST_DWithin(posicion_suavizada, parada.ubicacion, parada.radio_geocerca_m)

4. POR CADA PARADA DENTRO:
   - sin evento previo    → crear evento, NO notificar (empieza a contar permanencia)
   - evento sin notificar  → si permanencia >= permanencia_minima_s → NOTIFICAR
   - evento ya notificado  → no hacer nada. Nunca se repite en el mismo viaje.

5. DETECTAR SALIDAS (histéresis)
   se considera salida solo tras histeresis_salida_s continuos fuera.
   Si reentra antes, se considera que nunca salió (absorbe la deriva del GPS).
```

**Por qué importa:** sin permanencia mínima e histéresis, la deriva del GPS hace que una unidad
"entre y salga" de la geocerca varias veces por minuto y el usuario recibe notificaciones spam.

---

## ETA: estimado, no predictivo

```
ETA = distancia_restante_sobre_el_trazado / velocidad_referencia
```

- La distancia sigue el trazado real de la ruta (`ST_LineLocatePoint` + `ST_LineSubstring`), no
  la línea recta.
- La velocidad es el promedio de las últimas 5 posiciones usables, con un piso mínimo.
- Si hay incidencia activa, se aplica penalización y la interfaz lo indica.

**En textos de interfaz y documentación: "tiempo estimado" o "ETA estimado". Nunca "predictivo".**
El modelo predictivo con históricos es trabajo futuro declarado, no parte de este alcance.

---

## Convenciones de código

- TypeScript en todo lo de este repositorio. Sin `any` salvo justificación en comentario.
  (La app de la ruta es Kotlin y sigue sus propias convenciones.)
- Nombres de tablas, columnas y campos en **español** (coinciden con el dominio y con la tesis).
- Nombres de variables y funciones en **inglés**, salvo términos del dominio (`ruta`, `parada`,
  `unidad`, `viaje`), que se mantienen en español para no traducir a medias.
- Componentes React en PascalCase, archivos de utilidades en kebab-case.
- `types/database.generated.ts` **sale del esquema, no se edita a mano**. Tras cada migración se
  regenera con `npm run types:db` (requiere `SUPABASE_ACCESS_TOKEN` en el entorno). Los nombres
  cómodos que usa la aplicación viven en `types/database.ts`, que solo hace alias. Un tipo escrito
  a mano se desincroniza del esquema en silencio; uno generado no puede.
- Todo texto visible al usuario va en **español**, en sentence case. Nunca TODO MAYÚSCULAS.
- Nunca commitear `.env` ni `.env.local`. Las claves van en variables de entorno.

---

## Arquitectura de código y organización

### Principio rector

La vista nunca habla con la base de datos. Entre una pantalla y Supabase siempre hay al menos
una capa intermedia. Si un componente importa `supabase` directamente, está mal.

Esto no es purismo: es lo que permite cambiar una consulta sin tocar la interfaz, y probar la
lógica sin renderizar nada.

### Límites duros

| Regla | Límite |
|---|---|
| Líneas por archivo | **600 máximo.** Al acercarse, se divide. |
| Líneas por función | 50 máximo |
| Parámetros por función | 4 máximo (más allá, se pasa un objeto) |
| Niveles de anidación | 3 máximo |
| Responsabilidades por archivo | 1 |

**Sobre las 600 líneas:** es un techo, no un objetivo. Un archivo de 500 líneas ya es señal de
que hace demasiado. La mayoría de los archivos deberían estar entre 50 y 200.

Cuando un archivo crece: no se parte por la mitad arbitrariamente. Se identifica qué
responsabilidades distintas contiene y cada una se lleva a su propio archivo.

### Web (`ecoruta-web/`) — Arquitectura por capas

Next.js App Router ya impone su propia separación (Server Components, Client Components, Server
Actions). Se respeta esa separación y se le añaden capas de datos y dominio.

```
src/
├── app/                          # Rutas. Solo composición, sin lógica.
│   ├── (publico)/
│   │   ├── page.tsx              # Seguimiento del ciudadano
│   │   └── ruta/[id]/page.tsx
│   └── admin/
│       ├── layout.tsx            # Guard de sesión
│       ├── page.tsx              # Monitoreo en vivo
│       ├── rutas/page.tsx
│       ├── unidades/page.tsx
│       └── historicos/page.tsx
│
├── features/                     # Una carpeta por dominio funcional
│   ├── seguimiento/
│   │   ├── components/           # UI específica de esta feature
│   │   ├── hooks/                # Estado y efectos (el "ViewModel" de React)
│   │   └── types.ts
│   ├── rutas/
│   ├── unidades/
│   ├── monitoreo/
│   └── historicos/
│
├── services/                     # ÚNICA capa que habla con Supabase
│   ├── rutas.service.ts
│   ├── paradas.service.ts
│   ├── unidades.service.ts
│   ├── posiciones.service.ts
│   └── incidencias.service.ts
│
├── domain/                       # Lógica de negocio pura, sin dependencias
│   ├── eta.ts                    # Cálculo de tiempo estimado
│   ├── geocerca.ts               # Reglas de permanencia e histéresis
│   └── telemetria.ts             # Filtro de exactitud, suavizado
│
├── components/
│   ├── ui/                       # Compartidos: Boton, Tarjeta, Campo, IconoRuta...
│   └── mapa/                     # Capas de Leaflet: Mapa, marcadores, trazados
├── lib/
│   └── supabase/
│       ├── client.ts             # clienteNavegador() — lectura pública del ciudadano
│       └── server.ts             # crearClienteServidor() — Server Components y Actions
└── types/
    └── database.ts               # Tipos generados del esquema
```

#### Reglas de dependencia

```
app/  →  features/  →  services/  →  lib/supabase
                    ↘  domain/    (sin dependencias externas)
```

- `app/` no importa `services/` ni `lib/supabase`. Solo compone features.
- `features/components/` no importa `services/`. Recibe datos por props o por su hook.
- `features/hooks/` es el único punto donde una feature llama a `services/`.
- `services/` es el único lugar del proyecto que importa `lib/supabase`.
- `domain/` no importa nada del proyecto. Son funciones puras: entran datos, salen datos.

**Por qué `domain/` importa:** el cálculo del ETA y las reglas de geocerca son las piezas que hay
que explicar en la tesis. Aisladas en funciones puras, se leen, se prueban y se defienden. Metidas
dentro de un componente React, no.

### App de la ruta — su arquitectura no se decide aquí

Es un proyecto Android independiente y documenta su propia estructura. Este archivo no la
prescribe: hacerlo desde afuera produciría dos documentos que se contradicen, y el de aquí
sería el que nadie actualiza.

Lo que sí es responsabilidad de este repositorio, porque afecta a las dos superficies:

**Las reglas del dominio son las mismas en ambos lados.** El filtro de exactitud, el suavizado y
la frecuencia de emisión adaptativa se implementan en la app y en el servidor, pero la
definición autoritativa es la de este documento (ver «Lógica crítica: evaluación de geocercas»)
y la de `sql/`. Si una regla cambia, cambia aquí primero y se anuncia; que la app la calcule
distinto al servidor es el peor resultado posible, porque nadie ve el error hasta que las
notificaciones salen mal.

**Los valores calibrables salen de la tabla `parametros`, no del código de la app.** Son los
mismos umbrales que usa el servidor para evaluar geocercas. Quemarlos en el APK los
desincroniza en silencio y obliga a publicar una versión nueva para cambiar un número.

**Lo que la app puede hacer contra el backend está en `docs/contrato-vinculacion.md`**, con la
tabla de lo que RLS le permite. Ese archivo es la frontera: si la app necesita algo que no está
ahí, se agrega ahí y se implementa en este repositorio.

### Nomenclatura de archivos (`ecoruta-web/`)

| Tipo | Convención | Ejemplo |
|---|---|---|
| Componente | PascalCase | `TarjetaUnidad.tsx` |
| Hook | camelCase con `use` | `useEditorDeRuta.ts` |
| Servicio | camelCase + `.service` | `unidades.service.ts` |
| Dominio / utilidad | kebab-case | `eta.ts`, `telemetria.ts` |
| Tipos | PascalCase | `Viaje.ts` |

### Clean Code aplicado

**Nombres.** Descriptivos, sin abreviar. `calcularEtaEstimado()` sobre `calcEta()`.
`posicionesUsables` sobre `pos`. El nombre debe explicar sin necesidad de comentario.

**Funciones.** Una sola cosa, a un solo nivel de abstracción. Si una función tiene un comentario
que dice "// ahora calculamos X", ese bloque es otra función.

**Comentarios.** Se comenta el *por qué*, nunca el *qué*. El código dice qué hace; el comentario
dice por qué se hizo así.

```ts
// MAL — explica lo obvio
// Filtramos las posiciones usables
const usables = posiciones.filter(p => p.usable)

// BIEN — explica la razón
// Las lecturas de baja exactitud no evalúan geocercas: producen
// falsos disparos por deriva del GPS (ver revisión técnica, punto 4)
const usables = posiciones.filter(p => p.usable)
```

**Sin números mágicos.** Los valores calibrables vienen de la tabla `parametros`. Los que no,
son constantes con nombre.

**Errores explícitos.** Los servicios devuelven un resultado tipado, no lanzan excepciones sin
control. La vista siempre puede mostrar un estado de error legible en español.

**Sin duplicación.** Si la misma lógica aparece dos veces, va a `domain/`. El filtro de exactitud
y el suavizado se implementan una vez por proyecto, no una vez por pantalla.

### Qué hacer cuando un archivo crece

1. Identificar las responsabilidades distintas que contiene.
2. Extraer la lógica de negocio a `domain/`.
3. Extraer el acceso a datos a `services/`.
4. Extraer sub-componentes de UI a `components/`.
5. Lo que queda es la composición.

Un componente de pantalla bien organizado rara vez pasa de 150 líneas, porque casi todo lo que
hacía vive ahora en otra capa.

---

## Sistema de diseño

Paleta cálida sobre fondo crema, con acento terracota y titulares en serif. La intención es que
el sistema se sienta cercano y local, no corporativo ni genérico.

### Tipografía

Elegidas y en uso. No son candidatas: cambiarlas implica tocar `layout.tsx`, los tokens de
`globals.css` y las once maquetas de `diseno/`.

- Titulares, nombres de ruta y cifras: **Merriweather** (serif). Pesos 400, 700, 900.
- Cuerpo, datos e interfaz: **Source Sans 3** (sans-serif). Pesos 400, 600, 700.
- **No usar Inter, Roboto, Open Sans ni las fuentes por defecto del sistema.**
- Sentence case siempre.

> Merriweather es más pesada y menos elegante que una serif de display, pero se eligió por
> legibilidad: las cifras de tiempo estimado se leen de un vistazo, en la calle y con sol.

### Superficies

- Fondo base: crema `oklch(97% 0.015 75)`
- Superficie elevada: crema más claro `oklch(99% 0.008 75)`
- Bordes: 0.5px, `oklch(85% 0.02 60)`
- Sin sombras, sin degradados, sin glassmorphism.
- Esquinas: 8–12px; pills 999px.
- Espaciado en múltiplos de 4px.

### Fotografía

Una sola foto de identidad: el atardecer sobre los Morros de San Juan (foto propia). Original y
recortes en `diseno/recursos/`.

**Dónde va:** solo en zonas de identidad, donde no compite con datos.
- Panel derecho del ingreso del admin (solo escritorio).
- Imagen de Open Graph de la web (`src/app/opengraph-image.jpg`): vista previa al compartir.
- Hero de la landing, cuando exista.
- Bienvenida de la app de la ruta, y fondo de pantalla del teléfono kiosco.

**Dónde no:** pantallas con mapa, monitoreo, tablas, alertas ni estados vacíos. El mapa es el
contenido; una foto detrás compite con las líneas y los marcadores de ruta. Su naranja también
se confundiría con colores de ruta o de estado.

**Texto y foto:** en la web el texto va al lado de la foto o sobre una superficie sólida, nunca
directo encima, así que se mantiene la regla de "sin degradados". La única excepción es la
bienvenida de la app de la ruta, que tiene su propio sistema visual y usa un degradado para
fundir la foto con el fondo.

**Técnica:** importación estática con `next/image` (medidas y placeholder automáticos), AVIF/WebP
desde `next.config.ts`, y sin `preload` donde la foto está oculta en móvil. Si es decorativa,
`alt=""`.

### Regla de color que no se rompe

**El color de marca nunca es color de ruta, y nunca es color de estado.**

Tres paletas con funciones separadas. Si se mezclan, el sistema deja de comunicar.

**1. Marca — terracota**

```
Terracota          oklch(58% 0.17 35)   identidad, acentos de navegación
Terracota profundo oklch(48% 0.15 35)   botones con texto blanco (4.8:1, cumple AA)
```

Uso exclusivo: logo, botones primarios, elementos de identidad, acentos de navegación.
**Nunca** para representar una ruta ni un estado del sistema.

> El terracota de marca con texto blanco da 3.4:1 y **no cumple AA**. Por eso todo relleno con
> texto blanco encima usa la variante profunda. El tono de marca se conserva para identidad,
> texto sobre crema y acentos.

**2. Colores de ruta — cinco tonos distinguibles**

El admin asigna uno por ruta. Se diferencian **por tono**, no por saturación.

```
Teal      oklch(52% 0.11 195)
Mostaza   oklch(70% 0.14 75)
Ciruela   oklch(48% 0.13 340)
Oliva     oklch(50% 0.10 145)
Índigo    oklch(48% 0.12 265)
```

Ninguno cae en el rango del terracota ni del rojo de error, a propósito.

**Por qué importa:** la identificación de ruta por color es una función del sistema, no
decoración. El gestor distingue unidades en el mapa por color; el ciudadano relaciona el chip
de su ruta con la línea del mapa. Cinco tonos del mismo naranja hacen esa tarea imposible,
especialmente para daltonismo rojo-verde (el más frecuente).

**Regla de refuerzo:** el color nunca es el único portador de significado. Cada ruta lleva
además su nombre visible, y cada marcador de unidad lleva su ícono.

> Mostaza es el único tono claro de los cinco: un ícono blanco encima da 2.3:1 y no alcanza ni
> el mínimo de 3:1 para elementos no textuales. El marcador de una ruta mostaza lleva el ícono
> en tinta oscura. Los otros cuatro lo llevan blanco.

**3. Colores de estado**

```
En vivo / éxito   oklch(52% 0.13 155)   verde
Advertencia       oklch(68% 0.15 70)    ámbar
Error / crítico   oklch(48% 0.19 25)    rojo profundo
Información       oklch(52% 0.12 240)   azul
Ubicación usuario oklch(55% 0.15 250)   azul distintivo
```

El rojo de error es más oscuro y saturado que el terracota de marca. Deben verse claramente
distintos al lado. El azul de ubicación del usuario no se usa para ninguna otra cosa.

### Componentes

**Marcador de unidad.** Círculo del color de su ruta, ícono dentro (bus para transporte, camión
para recolección). Halo pulsante si está transmitiendo; atenuado y sin halo si perdió señal.

**Chip de ruta.** Punto del color de la ruta + nombre. Estado activo con fondo tenue del mismo
tono. Nunca solo el punto sin nombre.

**Tarjeta de unidad (admin).** Nombre, ruta, velocidad, última señal, batería. Borde ámbar si la
batería está bajo umbral; borde rojo si superó el umbral sin señal.

**Ubicación del ciudadano.** Punto azul con aro de precisión pulsante. Visualmente distinto de
cualquier marcador de unidad.

### Animación y accesibilidad

- Easing `ease-out`, duración 300–500ms. Sin bounce.
- El pulso de "en vivo" es de 2s, suave, no intrusivo.
- Respetar `prefers-reduced-motion`: sin animación cuando esté activo.
- Objetivos táctiles mínimos de 48px.
- Foco visible en todo elemento interactivo.
- Contraste WCAG AA como mínimo (4.5:1 en texto, 3:1 en elementos de interfaz).
- Marcado semántico: `<button>`, `<label>`, `<nav>`. Nunca un `<div>` con estilos de botón.

---

## Reglas de seguridad

- El ciudadano **nunca** se autentica. Lectura pública vía RLS sobre `rutas`, `paradas`,
  `unidades`, `posiciones`, `viajes`, `incidencias` y `parametros`. Los parámetros se leen —no se
  escriben— porque la web debe usar los mismos umbrales que el servidor; quemarlos en el
  código los desincronizaría de las geocercas.
- Un dispositivo **solo** puede escribir posiciones de su propia unidad. Se garantiza por RLS
  comparando `unidad_id` contra el JWT, no por lógica en el cliente.
- El código de vinculación es temporal (expira en minutos) y de un solo uso. El canje ocurre
  en la Edge Function `vincular-dispositivo`, nunca en el cliente: es la única forma de grabar
  `app_metadata.unidad_id`, que es el claim del que depende toda la autorización del dispositivo.
  **La clave `service_role` jamás entra en el APK** — salta RLS por completo y se extrae de un
  APK en minutos. El contrato para la app está en `docs/contrato-vinculacion.md`.
- Todas las tablas tienen RLS activo. Ninguna excepción.

---

## Estado del proyecto

**Hecho**
- Arquitectura y stack definidos
- Modelo de datos completo con índices y RLS
- Prototipos visuales de las 9 pantallas
- Respuesta a la revisión técnica del tutor, con correcciones integradas
- Admin: rutas, paradas y trazado sobre el mapa; unidades; monitoreo
- Web del ciudadano, desplegada en Vercel
- Backend de vinculación: Edge Function `vincular-dispositivo` + RLS del dispositivo,
  probado de punta a punta (ver `docs/contrato-vinculacion.md`)
- Evaluación de geocercas: `registrar-posicion`, con los 5 pasos verificados contra la
  base (entrada, permanencia, notificación única, salida e histéresis)

**En curso**
- App de la ruta, en una sesión aparte y en un proyecto Android fuera de este repositorio.
  Consume el contrato de vinculación; no cambia el backend.

**Siguiente, en este orden**
1. App de la ruta: transmisión de posiciones y buffer offline
2. Prueba de campo de precisión GPS → calibra `exactitud_maxima_m` y los radios de geocerca.
   El algoritmo ya está construido, pero **sus números no son de fiar hasta esta prueba**.
   Todos salen de `parametros`, así que calibrar es correr `update`, no tocar código.
3. Realtime: entregar la notificación al ciudadano y mover el mapa del admin sin recargar.
   Hoy la evaluación marca `notificado_at` pero nadie recibe el aviso.
4. Admin: históricos

> El orden 1 y 2 estaba invertido: la prueba de campo iba primero. Se construyó el algoritmo
> antes porque la prueba depende de que la app transmita, y esperar habría dejado parado el
> núcleo del sistema. El motivo de la regla se respeta igual: nada quedó hardcodeado.

---

## Principios de trabajo del agente

De cumplimiento estricto, en todas las tareas:

1. **Piensa antes de programar.** Expón suposiciones, dudas, alternativas y trade-offs antes de
   escribir código.
2. **KISS.** Resuelve la solicitud actual sin funciones ni abstracciones especulativas. La
   solución más simple que cubra del todo la necesidad.
3. **Cambios quirúrgicos.** Modifica solo lo que la tarea requiere; preserva el código
   circundante.
4. **Define y verifica el objetivo.** Conviértelo en un resultado verificable antes de darlo por
   terminado (typecheck, lint, prueba manual, etc.).
5. **Escritura clara.** El código se explica solo. El comentario dice el *por qué*, nunca el
   *qué*, y solo cuando hace falta.

Estos principios conviven con "Cómo trabajar en este proyecto" (abajo) y con "Clean Code
aplicado" (arriba); si algo se contradice, gana lo más restrictivo.

---

## Navegación del código: codegraph

El repo está indexado con **codegraph** (existe `.codegraph/` en la raíz). Para entender o
localizar código, **usa codegraph antes que `grep`, `find` o abrir archivos a ciegas**:

- Tool MCP `codegraph_explore` (tras reiniciar Claude Code) — símbolos relevantes + su código
  verbatim + las rutas de llamada entre ellos, en una sola llamada.
- Shell (siempre): `codegraph explore "<pregunta o símbolos>"`, `codegraph node "<archivo|símbolo>"`,
  `codegraph callers "<símbolo>"`, `codegraph impact "<símbolo>"`, `codegraph query "<texto>"`.
- Tras **crear** archivos nuevos: `codegraph index` (el sync incremental a veces no los toma).

Recurrir a lectura directa está bien para confirmar el contenido actual de un archivo que
codegraph ya señaló; no para descubrir dónde está algo.

---

## Skills del proyecto

Skills de Claude Code en `.claude/skills/<nombre>/SKILL.md`, cargadas bajo demanda. Invócalas
cuando la tarea encaje, en vez de re-derivar las reglas desde este documento.

| Skill | Cuándo usarla |
|---|---|
| **web-capas** | Añadir o modificar una pantalla, componente de feature, hook (ViewModel) o Server Action en `ecoruta-web`. Reglas de capas, límites de tamaño, patrones de composición. |
| **servicio-datos** | Escribir o cambiar un método en `services/*.service.ts`: patrón `Resultado<T>`, elegir cliente servidor vs. navegador, tipos del esquema, RPC de PostGIS. |
| **edge-geocerca** | La Edge Function de geocercas o cualquier trabajo sobre proximidad, permanencia, histéresis o suavizado. Contiene el algoritmo de 5 pasos que **no se simplifica**. |
| **esquema-sql** | Cambiar `sql/` (tablas, columnas geográficas, índices GiST, RLS) y regenerar tipos con `npm run types:db`. |

Al terminar una skill, el resto de reglas de este documento siguen aplicando.

---

## Cómo trabajar en este proyecto

- **Lee `sql/01_schema.sql` antes de escribir consultas.** No inventes nombres de columnas.
- Cuando una decisión ya está tomada en este documento, respétala. Si crees que es incorrecta,
  dilo explícitamente en vez de cambiarla por tu cuenta.
- Prefiere la solución simple. Este es un proyecto de grado con un plazo, no un sistema de
  producción a escala.
- Al proponer una alternativa a algo ya decidido, explica el costo del cambio.
- No agregues dependencias sin justificarlo.
- Si algo del contexto contradice al código, avisa: probablemente este documento quedó desactualizado.

### Contexto académico

Este es un proyecto de grado que se defiende ante un jurado. Eso implica:
- Las decisiones técnicas deben ser **explicables**, no solo funcionales.
- Se prefiere una solución que se pueda justificar en la tesis sobre una más sofisticada que no
  se pueda defender.
- El código y el esquema de base de datos forman parte de los anexos del documento final.
