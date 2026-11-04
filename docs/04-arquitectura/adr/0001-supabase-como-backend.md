# ADR-0001 — Supabase como backend, con Edge Functions en lugar de Express

| Campo | Valor |
|---|---|
| Estado | Aceptado |
| Registrado | 2026-11-04 |
| Responsable | Gabrieli Murillas Ramírez |

## Contexto

La tesis original proponía Express.js. El sistema necesita PostGIS, autenticación, tiempo real y una capa de lógica en el servidor, operados por una sola persona y sin presupuesto de infraestructura.

## Decisión

El backend es Supabase: PostgreSQL + PostGIS, Auth, Realtime, RLS y Edge Functions en TypeScript/Deno. La web de administración **no** es el backend: es otro cliente.

## Consecuencias

- Sin servidores propios que mantener; Realtime viene incluido.
- Dependencia de un proveedor y de su plan gratuito, que se pausa por inactividad (riesgo R4 del PRD).
- Las Edge Functions cumplen el rol de capa de backend en TypeScript.

## Alternativas descartadas

- **Express.js en un VPS:** más infraestructura y sin Realtime ni Auth listos.
- **PostgreSQL autoalojado:** se mantiene como salida si los costos lo exigen (H2).
