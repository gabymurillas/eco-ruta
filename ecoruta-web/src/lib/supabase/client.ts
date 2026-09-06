import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Cliente para el navegador. Guarda la sesión en cookies (no en localStorage)
 * para que el servidor pueda leerla y proteger `/admin` antes de renderizar.
 *
 * Por regla del proyecto se importa SOLO desde services/.
 */
export function crearClienteNavegador() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
