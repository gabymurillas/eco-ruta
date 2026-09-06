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
├── ecoruta-web/         ← Next.js: seguimiento del ciudadano (público) + admin (/admin)
└── ecoruta-ruta/        ← Expo: app del dispositivo instalado en cada unidad
```

## Requisitos

- Node.js 18+
- Un proyecto de Supabase con PostGIS activado
- Cuenta de Expo (para `ecoruta-ruta`) y Android Studio o Expo Go para probar

## Puesta en marcha

### Base de datos

Corre en orden, en el SQL Editor de Supabase:

```
sql/01_schema.sql
sql/02_parametros.sql
sql/03_rls.sql
```

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

### App de la ruta (`ecoruta-ruta/`)

```bash
cd ecoruta-ruta
npm install
npx expo start
```

## Variables de entorno

Ninguna clave se commitea. Ver `.env.local` (web) y el equivalente en `ecoruta-ruta/`, ambos
ignorados por git.
