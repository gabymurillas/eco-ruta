import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/entorno";

const RUTA_INGRESO = "/admin/ingreso";

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

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesNuevas) => {
        for (const { name, value } of cookiesNuevas) {
          request.cookies.set(name, value);
        }
        respuesta = NextResponse.next({ request });
        for (const { name, value, options } of cookiesNuevas) {
          respuesta.cookies.set(name, value, options);
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

  if (esZonaAdmin && !esIngreso && !user) {
    const destino = request.nextUrl.clone();
    destino.pathname = RUTA_INGRESO;
    return NextResponse.redirect(destino);
  }

  if (esIngreso && user) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/admin";
    return NextResponse.redirect(destino);
  }

  return respuesta;
}

export const config = {
  matcher: ["/admin/:path*"],
};
