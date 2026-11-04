# EcoRuta San Juan — guía para agentes

Sistema de monitoreo georreferenciado en tiempo real para rutas de transporte público y
recolección de desechos en San Juan de los Morros, Venezuela. Proyecto de grado de la UNERG,
Ingeniería en Informática.

**La documentación del proyecto vive en [`docs/`](docs/README.md) y es la fuente de verdad.**
Este archivo solo contiene lo que un agente necesita para trabajar en el código y enlaza a
`docs/` para todo lo demás. Si algo de aquí contradice a `docs/`, gana `docs/`: avisa y corrige.

| Necesitas… | Lee |
|---|---|
| Qué es el producto, para quién y qué falta | [`docs/02-producto/PRD.md`](docs/02-producto/PRD.md) · [`PRODUCT.md`](PRODUCT.md) |
| Sistema de diseño (colores, tipografía, componentes) | [`DESIGN.md`](DESIGN.md) · [`docs/03-diseno/`](docs/03-diseno/README.md) |
| Arquitectura, flujos y despliegue | [`docs/04-arquitectura/`](docs/04-arquitectura/README.md) |
| Modelo de datos, RLS y funciones | [`docs/04-arquitectura/modelo-de-datos.md`](docs/04-arquitectura/modelo-de-datos.md) (y siempre `sql/01_schema.sql`) |
| Geocercas, avisos y tiempo estimado | [`docs/04-arquitectura/geocercas-avisos-y-eta.md`](docs/04-arquitectura/geocercas-avisos-y-eta.md) |
| Por qué se decidió algo | [`docs/04-arquitectura/adr/`](docs/04-arquitectura/adr/README.md) |
| Qué dato puede ver el público | [`docs/05-trust-safety/politica-de-exposicion.md`](docs/05-trust-safety/politica-de-exposicion.md) |
| Brechas conocidas entre la política y el código | [`docs/05-trust-safety/registro-de-brechas.md`](docs/05-trust-safety/registro-de-brechas.md) |
| Frontera con la app Android | [`docs/contrato-vinculacion.md`](docs/contrato-vinculacion.md) |

---

## Arquitectura en una tabla

| Superficie | Quién la usa | Tecnología | Login |
|---|---|---|---|
| Web del usuario | Ciudadano | Next.js (rutas públicas) | No |
| Web de administración | Ente gestor | Next.js (`/admin`) | Sí |
| App de la ruta | Teléfono dedicado en el vehículo | Android nativo (Kotlin + Compose), **otro repositorio** | Vinculación única |
| Backend | — | Supabase (PostgreSQL + PostGIS, Auth, Realtime, Edge Functions) | — |

- **La web de administración NO es el backend.** El backend es Supabase.
- **La app de la ruta no vive aquí.** Comparte el backend y `docs/contrato-vinculacion.md`. Si
  necesitas cambiar algo que la app consume (una función, una política de RLS, la respuesta de
  una Edge Function), se cambia aquí y se anuncia allá; nunca al revés.
- **El dispositivo pertenece a la ruta** (ADR-0002) y **las geocercas se evalúan en el
  servidor** (ADR-0003). No propongas lo contrario sin leer esos ADR.

```
ecoruta/
├── CLAUDE.md · PRODUCT.md · DESIGN.md
├── docs/                ← documentación (fuente de verdad)
├── diseno/              ← maquetas .dc.html y foto de identidad
├── sql/                 ← esquema, RLS, funciones y migraciones (se aplican a mano)
├── supabase/functions/  ← _dominio/, vincular-dispositivo/, registrar-posicion/
└── ecoruta-web/         ← Next.js: público + /admin
```

---

## Reglas que no se negocian

**Modelo**
- Lee `sql/01_schema.sql` antes de escribir consultas. No inventes columnas.
- Toda columna geográfica es `geography(…, 4326)` con índice GiST.
- Los valores calibrables viven en `parametros`, **nunca en el código** (ni en el APK).
- `unique (viaje_id, parada_id)` en `eventos_geocerca` y `unique (viaje_id, parada_id, tipo)`
  en `avisos_parada` son la garantía final contra los avisos duplicados.
- Las paradas son de la ciudad; qué rutas pasan lo calcula `paradas_por_ruta`.
- `rutas.tipo` es texto libre; `rutas.icono` se elige (`bus`, `camion`, `cisterna`, `van`,
  `generico`); un valor desconocido cae al genérico.

**Geocercas.** El algoritmo de 5 pasos de `registrar-posicion` **no se simplifica**. Usa la
skill `edge-geocerca`.

**Tiempo estimado.** En interfaz y documentación: «tiempo estimado» o «ETA estimado». **Nunca
«predictivo».** La versión con historial por franja (CIU-09, ADR-0011) está en el alcance de la
tesis como versión mínima, con respaldo al cálculo simple.

**Seguridad**
- El ciudadano nunca se autentica. Todas las tablas tienen RLS. Sin excepciones.
- Un dispositivo solo escribe datos de su unidad (RLS contra `app_metadata.unidad_id`).
- **`service_role` jamás entra en la web ni en el APK.**
- Al público solo se le muestran unidades en viaje activo (ADR-0012). Cualquier dato público
  nuevo exige actualizar la política de exposición.
- Nunca commitear `.env` ni `.env.local`.

**Diseño.** [`DESIGN.md`](DESIGN.md) es normativo. Las tres reglas que más se rompen: el
terracota de marca nunca es color de ruta ni de estado; el color nunca va solo (siempre con
nombre o ícono); sin sombras ni degradados. Merriweather + Source Sans 3; nunca Inter ni Roboto.
Tuteo y sentence case.

---

## Convenciones de código

- TypeScript en todo este repositorio. Sin `any` salvo justificación en un comentario.
- Tablas, columnas y campos en **español**. Variables y funciones en **inglés**, salvo los
  términos del dominio (`ruta`, `parada`, `unidad`, `viaje`).
- Componentes en PascalCase (`TarjetaUnidad.tsx`); hooks `useXxx.ts`; servicios
  `xxx.service.ts`; dominio y utilidades en kebab-case.
- `types/database.generated.ts` **no se edita a mano**: `npm run types:db` tras cada migración.
  Los alias cómodos viven en `types/database.ts`.
- Todo texto visible en español, en sentence case. Nunca TODO MAYÚSCULAS.

### Capas de `ecoruta-web/src`

```
app/  →  features/  →  services/  →  lib/supabase
                    ↘  domain/   (puro, sin dependencias)
```

- `app/` solo compone features; no importa `services/` ni `lib/supabase`.
- `features/components/` no importa `services/`; recibe datos por props o por su hook.
- `features/hooks/` es el único punto donde una feature llama a `services/`.
- `services/` es el **único** lugar que importa `lib/supabase`. Devuelve `Resultado<T>`, no
  lanza.
- `domain/` no importa nada del proyecto.

### Límites

| Regla | Límite |
|---|---|
| Líneas por archivo | 600 máximo (lo normal es 50–200) |
| Líneas por función | 50 |
| Parámetros por función | 4 (más allá, un objeto) |
| Anidación | 3 niveles |
| Responsabilidades por archivo | 1 |

Cuando un archivo crece: la lógica va a `domain/`, el acceso a datos a `services/`, la
sub-interfaz a `components/`, y lo que queda es composición.

### Clean code

Nombres descriptivos sin abreviar. Una función hace una cosa. Los comentarios dicen el *por
qué*, nunca el *qué*. Sin números mágicos. Errores explícitos y legibles en español. La misma
lógica dos veces va a `domain/`.

---

## Principios de trabajo del agente

1. **Piensa antes de programar.** Expón suposiciones, dudas y trade-offs.
2. **KISS.** Sin abstracciones especulativas.
3. **Cambios quirúrgicos.** Solo lo que la tarea requiere.
4. **Define y verifica el objetivo** (typecheck, lint, prueba manual).
5. **Escritura clara.**
6. **Documenta en el mismo commit.** Si cambias un comportamiento, actualiza su documento en
   `docs/`; si tomas una decisión de arquitectura, escribe un ADR; si cierras una brecha, cita
   su `TS-XX`.

Cuando una decisión ya está tomada, respétala; si crees que es incorrecta, dilo explícitamente
y explica el costo del cambio. No agregues dependencias sin justificarlo. Si el contexto
contradice al código, avisa.

### Contexto académico

Es un proyecto de grado que se defiende ante un jurado: las decisiones deben ser
**explicables**. Se prefiere la solución defendible sobre la sofisticada. El código y el esquema
forman parte de los anexos de la tesis.

---

## Navegación del código: codegraph

El repo está indexado con **codegraph** (`.codegraph/`). Para entender o localizar código, úsalo
antes que `grep` o `find`: `codegraph explore "<pregunta>"`, `codegraph node`,
`codegraph callers`, `codegraph impact`. Tras crear archivos: `codegraph index`.

## Skills

| Skill | Cuándo |
|---|---|
| **web-capas** | Pantallas, componentes de feature, hooks o Server Actions en `ecoruta-web` |
| **servicio-datos** | Métodos en `services/*.service.ts`, `Resultado<T>`, RPC de PostGIS |
| **edge-geocerca** | La Edge Function de geocercas, la proximidad, la permanencia o la histéresis |
| **esquema-sql** | Cambios en `sql/` y regeneración de tipos |
| **impeccable** *(usuario)* | Diseño de interfaz: `critique`, `audit`, `polish`, `document`. Lee `PRODUCT.md` y `DESIGN.md` |
