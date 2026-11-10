import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/entorno";
import type { Database } from "@/types/database";
import { ajustarVencimiento, COOKIE_SESION_CORTA, OPCIONES_MARCA } from "./sesion-corta";

type Opciones = {
  /**
   * Solo al iniciar sesión: true pide una sesión que muera con el navegador,
   * false una que se mantenga. Sin indicarlo, se respeta la marca que ya haya.
   */
  sesionCorta?: boolean;
};

/**
 * Cliente para Server Components y Server Actions.
 *
 * En Next 16 `cookies()` es asíncrono. Un Server Component no puede escribir cookies:
 * cuando eso ocurre (al refrescar un token vencido) se ignora el error, porque el
 * proxy ya se encargó de renovar la sesión en la petición.
 *
 * Por regla del proyecto se importa SOLO desde services/.
 */
export async function crearClienteServidor({ sesionCorta }: Opciones = {}) {
  const almacenDeCookies = await cookies();

  if (sesionCorta === true) {
    almacenDeCookies.set(COOKIE_SESION_CORTA, "1", OPCIONES_MARCA);
  } else if (sesionCorta === false) {
    almacenDeCookies.delete(COOKIE_SESION_CORTA);
  }

  const corta = sesionCorta ?? almacenDeCookies.has(COOKIE_SESION_CORTA);

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => almacenDeCookies.getAll(),
      setAll: (cookiesNuevas) => {
        try {
          for (const { name, value, options } of cookiesNuevas) {
            almacenDeCookies.set(name, value, ajustarVencimiento(options, corta));
          }
        } catch {
          // Server Component: el proxy ya refrescó la sesión.
        }
      },
    },
  });
}
