---
name: web-capas
description: Crear o extender una feature de ecoruta-web respetando la arquitectura por capas de Next.js App Router. Úsala al añadir o modificar una pantalla, un componente de feature, un hook (ViewModel) o una Server Action.
---

# Feature de la web por capas

Si la feature consulta datos nuevos, lee antes `sql/01_schema.sql`.
Navega el código con codegraph (`codegraph explore "<tema>"`), no con grep ni lectura a ciegas.

## Dónde va cada cosa

| Necesitás… | Va en | Regla |
|---|---|---|
| Pantalla / ruta | `app/**/page.tsx` | Solo composición: llama a un service o monta una feature. Sin lógica. `export const dynamic = "force-dynamic"` si lee datos en vivo. |
| UI específica de la feature | `features/<dominio>/components/` | Recibe datos por props o del hook. NUNCA importa `services/`. |
| Estado y efectos de la feature | `features/<dominio>/hooks/use<X>.ts` | `"use client"`. Único punto cliente que llama a `services/`. Es el ViewModel. Sin JSX. |
| Mutación desde formulario | `features/<dominio>/acciones.ts` | `"use server"`. Valida → llama al service → `revalidatePath` + `redirect`. |
| Lógica de negocio pura | `domain/<nombre>.ts` | kebab-case, sin imports del proyecto. Entra dato, sale dato. |
| Acceso a datos | `services/<nombre>.service.ts` | Ver skill `servicio-datos`. |

## Reglas de dependencia (duras)

```
app/  →  features/  →  services/  →  lib/supabase/
                    ↘  domain/    (sin deps del proyecto)
```

- `app/` NO importa `services/` ni `lib/supabase`. Solo compone.
- `features/components/` NO importa `services/`.
- `services/` es el único lugar que importa `lib/supabase/*`.
- Si un componente importa `supabase` directo, está mal.

## Límites

- 600 líneas/archivo (techo, no meta; a las 500 ya sobra responsabilidad).
- 50 líneas/función · 4 parámetros (más → objeto) · 3 niveles de anidación · 1 responsabilidad/archivo.
- Una página bien organizada rara vez pasa de 150 líneas.

## Patrones ya establecidos en el código

- Consumir un service en una página:
  `const r = await obtenerX(); if (!r.ok) return <p role="alert" className="text-error">{r.error}</p>;`
- Next 16: el middleware es `src/proxy.ts` (no `middleware.ts`); `cookies()` es async.
- Texto visible: español, sentence case, nunca MAYÚSCULAS.
- Variables y funciones en inglés salvo términos del dominio: `ruta`, `parada`, `unidad`, `viaje`.
- Componentes PascalCase, utilidades kebab-case.
- Color: marca ≠ ruta ≠ estado. Ver `CLAUDE.md` § Sistema de diseño antes de elegir un token.

## Verificar antes de dar por terminada la tarea

```
npm run typecheck --prefix ecoruta-web
npm run lint --prefix ecoruta-web
```
