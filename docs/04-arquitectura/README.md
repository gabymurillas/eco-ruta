# Arquitectura

| Campo | Valor |
|---|---|
| Estado | Aprobado |
| Responsable | Gabrieli Murillas Ramírez |
| Última revisión | 2026-11-04 |

| Documento | Contenido |
|---|---|
| Este archivo | Contexto, contenedores, flujos y stack (modelo C4, niveles 1 y 2) |
| [modelo-de-datos.md](modelo-de-datos.md) | Tablas, invariantes, RLS y funciones |
| [geocercas-avisos-y-eta.md](geocercas-avisos-y-eta.md) | Algoritmo crítico: los 5 pasos, los avisos y el tiempo estimado |
| [contrato-vinculacion.md](../contrato-vinculacion.md) | Frontera con la app Android (se queda en `docs/` porque la app lo referencia por esa ruta) |
| [adr/](adr/README.md) | Registro de decisiones de arquitectura |

---

## 1. Contexto (C4, nivel 1)

```mermaid
flowchart LR
  C([Ciudadano<br/>sin cuenta]) -->|consulta su parada| W[EcoRuta<br/>web pública]
  A([Administrador<br/>alcaldía]) -->|configura y monitorea| P[EcoRuta<br/>admin]
  CH([Chofer]) -->|inicia y finaliza| D[App del<br/>dispositivo]
  W & P & D --> B[(Backend<br/>Supabase)]
  W & P --> OSM[Teselas OSM]
  P --> OSRM[OSRM público]
  P --> PH[Photon / Komoot]
```

## 2. Contenedores (C4, nivel 2)

| Contenedor | Tecnología | Responsabilidad | Repositorio |
|---|---|---|---|
| Web pública | Next.js App Router, React 19, Tailwind 4, react-leaflet | Seguimiento del ciudadano; lectura anónima y Realtime | `ecoruta-web/` (rutas públicas) |
| Web de administración | Ídem, en `/admin`, sesión en cookies (`@supabase/ssr`) | Configuración, monitoreo e históricos | `ecoruta-web/` (`/admin`) |
| App del dispositivo | Kotlin, Jetpack Compose, Room, WorkManager, Retrofit | Telemetría con buffer offline, latido e incidencias | Repositorio aparte (`eco-ruta-app`) |
| Base de datos | PostgreSQL + PostGIS (Supabase) | Modelo, RLS y funciones geoespaciales | `sql/` |
| Edge Function `vincular-dispositivo` | Deno/TypeScript, `verify_jwt=false` | Canje del código; graba `app_metadata.unidad_id` | `supabase/functions/` |
| Edge Function `registrar-posicion` | Deno/TypeScript, `verify_jwt=true` | Recibe la telemetría y evalúa geocercas y avisos de forma síncrona | `supabase/functions/` |
| Realtime | Supabase Realtime | Difunde posiciones, viajes, incidencias y avisos | `sql/12_realtime_monitoreo.sql` |
| Hospedaje web | Vercel (equipo eva-projecs, proyecto eco-ruta) | Despliegue de `master` | — |

## 3. Flujos clave

### 3.1 Telemetría y avisos

```mermaid
sequenceDiagram
  participant D as Dispositivo
  participant F as registrar-posicion
  participant DB as Postgres/PostGIS
  participant RT as Realtime
  participant W as Web ciudadano
  D->>D: Guarda la posición en Room (buffer)
  D->>F: POST lote del viaje (JWT del dispositivo)
  F->>DB: Inserta posiciones (RLS: solo su unidad)
  F->>DB: Evalúa geocercas sobre la lectura más reciente
  F->>DB: Inserta avisos_parada (unique viaje, parada, tipo)
  F-->>D: 200 → el dispositivo borra el lote
  DB-->>RT: Cambios publicados
  RT-->>W: «Se acerca» / «ya pasó»
```

Si falla la evaluación, el error vuelve al dispositivo y este reintenta desde su buffer
([ADR-0004](adr/0004-evaluacion-sincrona.md)).

### 3.2 Vinculación

Admin → «Vincular» → código de 5 caracteres (10 min, un solo uso) → el teléfono llama a
`vincular-dispositivo` con la clave publicable → la función crea la cuenta Auth con
`app_metadata.unidad_id` → el teléfono recibe la sesión. El detalle está en el
[contrato](../contrato-vinculacion.md).

### 3.3 Consulta del ciudadano

Ubicación del navegador → RPC `paradas_cercanas(lat, lng)` → selección de la parada →
`llegadas_a_parada` (tiempo estimado) → suscripción Realtime a `avisos_parada` de esa parada.

## 4. Organización del código web

```
app/  →  features/  →  services/  →  lib/supabase
                    ↘  domain/   (puro, sin dependencias)
```

Solo `services/` importa Supabase. Las reglas completas y los límites de tamaño están en
`CLAUDE.md` § Arquitectura de código y en las skills `web-capas` y `servicio-datos`.

## 5. Atributos de calidad

| Atributo | Táctica |
|---|---|
| Disponibilidad con red degradada | Buffer offline de 2 h; entrega del lote completo; reintentos con WorkManager |
| Exactitud | Filtro de exactitud, suavizado, permanencia e histéresis |
| Seguridad | RLS en todas las tablas; claims en `app_metadata`; `service_role` solo en el servidor |
| Rendimiento geoespacial | Índices GiST en toda columna `geography` |
| Calibrabilidad | Tabla `parametros`, leída por el servidor, la web y la app |
| Costo | Servicios gestionados en planes gratuitos; Leaflet y OSM sin clave |

## 6. Despliegue y entornos

| Entorno | Dónde | Notas |
|---|---|---|
| Producción web | `eco-ruta-nine.vercel.app` | Push a `master`; `autoAssignCustomDomains` debe estar encendido |
| Backend | Supabase `yumfwnqvmcitjnskazgx` | Las migraciones de `sql/` se aplican a mano (SQL Editor o CLI) |
| Edge Functions | `npx supabase functions deploy <f>` | — |
| Pruebas de SQL | Clúster desechable de Postgres 17 + PostGIS | Ver la guía del repositorio |
