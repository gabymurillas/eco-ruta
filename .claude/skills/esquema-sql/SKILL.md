---
name: esquema-sql
description: Cambiar el esquema de la base (archivos sql/), añadir tablas, columnas geográficas, índices o políticas RLS en Supabase/PostGIS, y regenerar los tipos.
---

# Migración de esquema (sql/)

El esquema autoritativo es `sql/01_schema.sql`. Léelo antes de cambiar nada.

```
sql/
  01_schema.sql              tablas, columnas, índices
  02_parametros.sql          valores calibrables (seed de la tabla parametros)
  03_rls.sql                 políticas Row Level Security
  04_funciones.sql           funciones PostGIS (paradas_cercanas, llegadas_a_parada, …)
  05_consultas_historicos.sql
```

## Reglas del modelo (no se negocian)

- Toda columna geográfica es `geography(Point|LineString, 4326)` y **lleva índice GiST**.
  Sin él, `ST_DWithin` recorre la tabla entera.
- Valores calibrables (permanencia, umbral de exactitud, intervalos de emisión) → tabla
  `parametros`, con seed en `02_parametros.sql`. Nunca hardcodeados.
- `eventos_geocerca` mantiene `unique (viaje_id, parada_id)`.
- `rutas.tipo` es texto libre a propósito (transporte, aseo, agua, gas). La unidad hereda el
  tipo de su ruta; no lo declara.
- `rutas.icono`: valores reconocidos `bus`, `camion`, `cisterna`, `van`, `generico`. Nulo o
  desconocido → marcador genérico. Añadir un ícono no exige migración.

## RLS (obligatorio en toda tabla)

- Tabla nueva → `enable row level security` + políticas en `03_rls.sql`. Sin excepción.
- El ciudadano NO se autentica: lectura pública vía RLS sobre `rutas`, `paradas`, `unidades`,
  `posiciones`, `viajes`, `incidencias` y `parametros` (los parámetros se leen, no se escriben:
  la web usa los mismos umbrales que el servidor).
- Un dispositivo solo escribe posiciones de su propia unidad: la política compara `unidad_id`
  contra el JWT, no el cliente.
- Código de vinculación: temporal (expira en minutos), un solo uso.

## Después de aplicar la migración

```
cd ecoruta-web && npm run types:db     # requiere SUPABASE_ACCESS_TOKEN en el entorno
```

Regenera `src/types/database.generated.ts` desde el esquema — no lo edites a mano. Los alias
cómodos de la aplicación van en `src/types/database.ts`.

Aplicar contra Supabase por MCP (`apply_migration`) o CLI. Prueba local antes que remoto.
