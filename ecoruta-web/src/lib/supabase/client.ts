import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/entorno";
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
  instancia ??= createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

  return instancia;
}
