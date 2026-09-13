import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/entorno";
import type { Database } from "@/types/database";

/**
 * Cliente para Server Components y Server Actions.
 *
 * En Next 16 `cookies()` es asíncrono. Un Server Component no puede escribir cookies:
 * cuando eso ocurre (al refrescar un token vencido) se ignora el error, porque el
 * proxy ya se encargó de renovar la sesión en la petición.
 *
 * Por regla del proyecto se importa SOLO desde services/.
 */
export async function crearClienteServidor() {
  const almacenDeCookies = await cookies();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => almacenDeCookies.getAll(),
      setAll: (cookiesNuevas) => {
        try {
          for (const { name, value, options } of cookiesNuevas) {
            almacenDeCookies.set(name, value, options);
          }
        } catch {
          // Server Component: el proxy ya refrescó la sesión.
        }
      },
    },
  });
}
