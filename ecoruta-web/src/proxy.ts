import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { leerRolDelPanel } from "@/domain/roles";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/entorno";
import { ajustarVencimiento, COOKIE_SESION_CORTA } from "@/lib/supabase/sesion-corta";

const RUTA_INGRESO = "/admin/ingreso";

/** Se abren sin sesión: entrar y recuperar la contraseña. */
const RUTAS_SIN_SESION = new Set([RUTA_INGRESO, "/admin/recuperar", "/admin/auth/confirmar"]);

/**
 * Renueva la sesión en cada petición y protege `/admin`.
 *
 * En Next 16 esto se llama `proxy.ts` (antes `middleware.ts`).
 *
 * Es la primera barrera, no la única: la autorización real la impone RLS en la base
 * de datos. Un token manipulado no pasaría de aquí, pero tampoco leería nada.
 */
export async function proxy(request: NextRequest) {
  let respuesta = NextResponse.next({ request });
  const sesionCorta = request.cookies.has(COOKIE_SESION_CORTA);

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesNuevas) => {
        for (const { name, value } of cookiesNuevas) {
          request.cookies.set(name, value);
        }
        respuesta = NextResponse.next({ request });
        for (const { name, value, options } of cookiesNuevas) {
          respuesta.cookies.set(name, value, ajustarVencimiento(options, sesionCorta));
        }
      },
    },
  });

  // getUser() valida el token contra Supabase; getSession() solo lee la cookie
  // y por eso no sirve para decidir un acceso.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ruta = request.nextUrl.pathname;
  const esZonaAdmin = ruta.startsWith("/admin");
  const esIngreso = ruta === RUTA_INGRESO;

  if (esZonaAdmin && !RUTAS_SIN_SESION.has(ruta) && !user) {
    const destino = request.nextUrl.clone();
    destino.pathname = RUTA_INGRESO;
    return NextResponse.redirect(destino);
  }

  // Solo una cuenta del panel (admin u operador) salta el ingreso. Otra con sesión
  // (alguien a quien le quitaron el rol) iría al panel, el panel la devolvería
  // aquí y el proxy otra vez al panel: un bucle de redirecciones sin salida.
  if (esIngreso && leerRolDelPanel(user?.app_metadata?.rol)) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/admin";
    return NextResponse.redirect(destino);
  }

  return respuesta;
}

export const config = {
  matcher: ["/admin/:path*"],
};
