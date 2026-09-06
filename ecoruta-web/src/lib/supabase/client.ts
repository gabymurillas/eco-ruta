import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Cliente para el navegador. Guarda la sesión en cookies (no en localStorage)
 * para que el servidor pueda leerla y proteger `/admin` antes de renderizar.
 *
 * Se memoiza: cada instancia abre su propio canal de Realtime, y crear una por
 * llamada multiplicaría las conexiones sin que nadie las cierre.
 *
 * Por regla del proyecto se importa SOLO desde services/.
 */
let instancia: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function clienteNavegador() {
  instancia ??= createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  return instancia;
}
