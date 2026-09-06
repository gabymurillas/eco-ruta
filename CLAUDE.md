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
| **App de la ruta** | Teléfono dedicado en el vehículo | Expo / React Native (APK Android) | Vinculación única |
| **Backend** | — | Supabase (PostgreSQL + PostGIS) | — |

**La web de administración NO es el backend.** Es otra interfaz cliente. El backend es Supabase.

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
│   └── 03_rls.sql
├── ecoruta-web/         ← Next.js: usuario (público) + admin (/admin)
└── ecoruta-ruta/        ← Expo: app del dispositivo
```

Los proyectos web y móvil son independientes. Comparten backend, no código.

---

## Stack

**Web (`ecoruta-web/`)**
- Next.js App Router + TypeScript + Tailwind CSS
- `@supabase/supabase-js` (con Realtime)
- `react-map-gl` sobre Mapbox GL JS
- Deploy: Vercel

**App de la ruta (`ecoruta-ruta/`)**
- Expo (React Native) + TypeScript
- `expo-location` + `expo-task-manager` → GPS en segundo plano vía foreground service
- `expo-keep-awake`
- AsyncStorage → buffer offline
- Build: EAS Build, **solo Android**. iOS está descartado del proyecto.

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

Vive en una Edge Function, se dispara con cada posición nueva. **No la simplifiques.** Cada paso
responde a un problema real detectado en la revisión técnica del proyecto.

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

- TypeScript en todo. Sin `any` salvo justificación en comentario.
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
├── components/ui/                # Componentes compartidos: Button, Card, Badge...
├── lib/
│   ├── supabase.ts               # Cliente. Se importa SOLO desde services/
│   └── mapbox.ts
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

### App de la ruta (`ecoruta-ruta/`) — MVVM

Aquí sí aplica MVVM con claridad: la app tiene estado complejo y de larga vida (viaje activo,
buffer offline, estado de conexión) que no pertenece a ninguna pantalla.

```
src/
├── views/                        # VIEW — solo presentación
│   ├── VinculacionView.tsx
│   ├── EnEsperaView.tsx
│   ├── EnRecorridoView.tsx
│   └── IncidenciaView.tsx
│
├── viewmodels/                   # VIEWMODEL — estado y acciones
│   ├── useVinculacionViewModel.ts
│   ├── useRecorridoViewModel.ts
│   └── useIncidenciaViewModel.ts
│
├── models/                       # MODEL — entidades del dominio
│   ├── Viaje.ts
│   ├── Posicion.ts
│   └── Dispositivo.ts
│
├── services/                     # Acceso a datos y APIs del sistema
│   ├── supabase.service.ts
│   ├── location.service.ts       # expo-location + TaskManager
│   ├── buffer.service.ts         # cola offline en AsyncStorage
│   └── vinculacion.service.ts
│
├── domain/                       # Lógica pura, compartida conceptualmente con la web
│   ├── telemetria.ts             # filtro de exactitud, suavizado
│   └── frecuencia.ts             # intervalo adaptativo movimiento/detenido
│
├── components/                   # UI reutilizable: EstadoCard, BotonGrande...
├── tasks/
│   └── locationTask.ts           # tarea de segundo plano registrada
└── config/
    └── theme.ts
```

#### Contrato MVVM

**View** — Solo JSX y estilos. Recibe todo de su ViewModel. Sin `useState` propio salvo estado
puramente visual (un acordeón abierto). Sin llamadas a servicios. Sin lógica condicional de
negocio.

**ViewModel** — Un hook por vista. Contiene el estado de la pantalla y las acciones que la vista
dispara. Llama a `services/` y a `domain/`. No contiene JSX.

**Model** — Tipos y entidades. Sin lógica de acceso a datos.

**Service** — Habla con Supabase, con el GPS, con AsyncStorage. No conoce las vistas.

Ejemplo del contrato:

```ts
// viewmodels/useRecorridoViewModel.ts
export function useRecorridoViewModel() {
  // estado, efectos, llamadas a services y domain
  return { viaje, estadoGps, bateria, ultimaSenal, iniciar, finalizar }
}

// views/EnRecorridoView.tsx
export function EnRecorridoView() {
  const vm = useRecorridoViewModel()
  return (/* solo JSX usando vm */)
}
```

### Nomenclatura de archivos

| Tipo | Convención | Ejemplo |
|---|---|---|
| Componente / View | PascalCase | `EnRecorridoView.tsx` |
| Hook / ViewModel | camelCase con `use` | `useRecorridoViewModel.ts` |
| Servicio | camelCase + `.service` | `location.service.ts` |
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
  `unidades`, `posiciones` e `incidencias`.
- Un dispositivo **solo** puede escribir posiciones de su propia unidad. Se garantiza por RLS
  comparando `unidad_id` contra el JWT, no por lógica en el cliente.
- El código de vinculación es temporal (expira en minutos) y de un solo uso.
- Todas las tablas tienen RLS activo. Ninguna excepción.

---

## Estado del proyecto

**Hecho**
- Arquitectura y stack definidos
- Modelo de datos completo con índices y RLS
- Prototipos visuales de las 9 pantallas
- Respuesta a la revisión técnica del tutor, con correcciones integradas

**En curso**
- Montaje de la estructura de proyectos

**Siguiente, en este orden**
1. Prueba de campo de precisión GPS → calibra `exactitud_maxima_m` y los radios de geocerca.
   **Va antes de construir geocercas.** Sin ese dato se trabaja a ciegas.
2. Admin: rutas y geocercas
3. Admin: unidades y dispositivos
4. App de la ruta: vinculación y transmisión
5. Edge Function de geocercas
6. Admin: monitoreo en vivo
7. Web del usuario
8. Admin: históricos

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
