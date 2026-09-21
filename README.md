# EcoRuta San Juan

Sistema de monitoreo georreferenciado en tiempo real para rutas de transporte público y
recolección de desechos en San Juan de los Morros, Venezuela.

Proyecto de grado — UNERG, Ingeniería en Informática.

La documentación completa (arquitectura, modelo de datos, convenciones de código, estado del
proyecto) vive en [`CLAUDE.md`](./CLAUDE.md). Este README es solo la guía rápida para arrancar.

## Estructura

```
ecoruta/
├── CLAUDE.md            ← arquitectura y decisiones del proyecto
├── sql/                 ← esquema, parámetros y RLS de Supabase
├── docs/                ← contrato de vinculación con la app
├── supabase/functions/  ← Edge Functions (Deno)
└── ecoruta-web/         ← Next.js: seguimiento del ciudadano (público) + admin (/admin)
```

La app que va instalada en cada unidad **no está en este repositorio**: es un proyecto
Android nativo (Kotlin + Compose) aparte. Lo único que comparte con este repo es el backend
y [`docs/contrato-vinculacion.md`](./docs/contrato-vinculacion.md).

## Requisitos

- Node.js 18+
- Un proyecto de Supabase con PostGIS activado

## Puesta en marcha

### Base de datos

Corre en orden, en el SQL Editor de Supabase:

```
sql/01_schema.sql
sql/02_parametros.sql
sql/03_rls.sql
sql/04_funciones.sql
sql/06_vinculacion.sql
sql/07_geocercas.sql
```

`sql/05_consultas_historicos.sql` no crea nada: documenta cómo se calcula cada indicador
de la pantalla de históricos.

### Web (`ecoruta-web/`)

```bash
cd ecoruta-web
npm install
cp .env.local.example .env.local   # completa con tu URL y clave de Supabase
npm run dev
```

### Tipos de la base de datos

`src/types/database.generated.ts` sale del esquema real y no se edita a mano. Después de cada
migración:

```bash
export SUPABASE_ACCESS_TOKEN=...   # token personal de Supabase
npm run types:db
```

### Edge Functions

- `vincular-dispositivo` se despliega con `verify_jwt = false`: el teléfono todavía no tiene
  sesión cuando la llama.
- `registrar-posicion` con `verify_jwt = true`: recibe la telemetría y evalúa las geocercas.

Las reglas puras que ambas comparten viven en `supabase/functions/_dominio/`.

## Variables de entorno

Ninguna clave se commitea. La web usa `.env.local`, ignorado por git; ver
`.env.local.example`.

**La clave `service_role` vive solo en el servidor.** Nunca en la web, nunca en el APK: salta
RLS por completo.
