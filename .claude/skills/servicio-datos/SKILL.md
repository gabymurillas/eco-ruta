---
name: servicio-datos
description: Escribir o modificar un método en services/*.service.ts de ecoruta-web. Úsala al añadir una consulta, un RPC de PostGIS o una mutación contra Supabase.
---

# Método de servicio (ecoruta-web)

`services/` es la ÚNICA capa que habla con Supabase.
Lee `sql/01_schema.sql` antes de escribir la consulta — no inventes nombres de columnas.
Para ver quién consume un service: `codegraph callers "<nombreFuncion>"`.

## Contrato: resultado tipado, sin excepciones

```ts
import { exito, fallo, type Resultado } from "./resultado";

export async function obtenerX(): Promise<Resultado<X[]>> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("...").select("...");
  if (error) return fallo("Mensaje legible en español, sin detalle técnico.");
  return exito(/* filas mapeadas al tipo de dominio */);
}
```

`Resultado<T> = { ok: true; datos: T } | { ok: false; error: string }` (en `services/resultado.ts`).
El mensaje de error lo lee un ciudadano o un admin: claro y en español.

## Qué cliente usar

| Contexto | Cliente | Import |
|---|---|---|
| Server Component / Server Action (admin, con sesión) | `crearClienteServidor()` | `@/lib/supabase/server` |
| Navegador, lectura pública del ciudadano (sin login) | `clienteNavegador()` | `@/lib/supabase/client` |

El ciudadano nunca se autentica: sus lecturas van por `clienteNavegador()` y RLS ya limita qué ve.
`clienteNavegador()` está memoizado — no lo envuelvas en otra caché.

## Tipos

- Fila de tabla: `Tables<"rutas">` vía `@/types/database` (alias de `database.generated.ts`).
- Retorno de función PostGIS: `Database["public"]["Functions"]["nombre"]["Returns"][number]`.
- Nunca edites `database.generated.ts`. Tras una migración: `npm run types:db` (ver skill `esquema-sql`).

## PostGIS

Cercanía, distancia sobre el trazado y geocercas se resuelven en el servidor vía RPC
(`.rpc("paradas_cercanas", { ... })`), nunca trayendo filas al cliente para medirlas:
no escala y desperdicia datos móviles.

## Reglas

- Sin `any` salvo comentario que lo justifique.
- Valores calibrables → tabla `parametros`. Los demás → constante con nombre. Nada de números mágicos.
- Una responsabilidad por función, ≤50 líneas.
- El comentario explica el *por qué*, nunca el *qué*.
