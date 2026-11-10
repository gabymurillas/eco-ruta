import { createBrowserClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/entorno";
import type { Database } from "@/types/database";
import { ajustarVencimiento, COOKIE_SESION_CORTA } from "./sesion-corta";

/**
 * Cliente para el navegador. Guarda la sesión en cookies (no en localStorage)
 * para que el servidor pueda leerla y proteger `/admin` antes de renderizar.
 *
 * Se memoiza: cada instancia abre su propio canal de Realtime, y crear una por
 * llamada multiplicaría las conexiones sin que nadie las cierre.
 *
 * Las cookies se escriben a mano y no con las de la librería: el cliente renueva
 * el token solo, con el panel abierto, y la librería fuerza 400 días de vida. Así
 * una sesión pedida corta («Mantener la sesión» desmarcado) se volvía permanente.
 *
 * Por regla del proyecto se importa SOLO desde services/.
 */
let instancia: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function clienteNavegador() {
  instancia ??= createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => parseCookieHeader(document.cookie).map(({ name, value }) => ({ name, value: value ?? "" })),
      setAll: (cookiesNuevas) => {
        const sesionCorta = parseCookieHeader(document.cookie).some(({ name }) => name === COOKIE_SESION_CORTA);

        for (const { name, value, options } of cookiesNuevas) {
          document.cookie = serializeCookieHeader(name, value, ajustarVencimiento(options, sesionCorta));
        }
      },
    },
  });

  return instancia;
}
