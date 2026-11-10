import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_RECUPERACION, OPCIONES_RECUPERACION } from "@/lib/recuperacion";
import { confirmarRecuperacion } from "@/services/auth.service";

/**
 * Destino del enlace del correo de recuperación. Canjea el enlace por una sesión
 * y lleva a elegir la contraseña; si el enlace no sirve, vuelve a pedirlo.
 */
export async function GET(request: NextRequest) {
  const parametros = request.nextUrl.searchParams;
  const codigo = parametros.get("code");
  const tokenHash = parametros.get("token_hash");

  const resultado = codigo
    ? await confirmarRecuperacion({ codigo })
    : tokenHash
      ? await confirmarRecuperacion({ tokenHash })
      : null;

  const destino = request.nextUrl.clone();
  destino.search = "";
  destino.pathname = resultado?.ok ? "/admin/restablecer" : "/admin/recuperar";

  if (!resultado?.ok) {
    destino.searchParams.set("error", "enlace");
    return NextResponse.redirect(destino);
  }

  const respuesta = NextResponse.redirect(destino);
  respuesta.cookies.set(COOKIE_RECUPERACION, "1", OPCIONES_RECUPERACION);
  return respuesta;
}
