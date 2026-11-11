import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_RECUPERACION, MARCA_INVITACION, OPCIONES_RECUPERACION } from "@/lib/recuperacion";
import { confirmarEnlaceDelCorreo, type MotivoDelEnlace } from "@/services/auth.service";

/**
 * Destino del enlace del correo, sea de recuperación o de invitación al equipo.
 * Canjea el enlace por una sesión y lleva a elegir la contraseña; si el enlace no
 * sirve, vuelve a pedirlo.
 *
 * La invitación llega con `type=invite` (lo escribe la plantilla del correo). Sin
 * `type`, o con cualquier otro valor, se trata como recuperación.
 */
export async function GET(request: NextRequest) {
  const parametros = request.nextUrl.searchParams;
  const codigo = parametros.get("code");
  const tokenHash = parametros.get("token_hash");

  const motivo: MotivoDelEnlace = parametros.get("type") === "invite" ? "invite" : "recovery";

  const resultado = codigo
    ? await confirmarEnlaceDelCorreo({ codigo })
    : tokenHash
      ? await confirmarEnlaceDelCorreo({ tokenHash, motivo })
      : null;

  const destino = request.nextUrl.clone();
  destino.search = "";
  destino.pathname = resultado?.ok ? "/admin/restablecer" : "/admin/recuperar";

  if (!resultado?.ok) {
    destino.searchParams.set("error", "enlace");
    return NextResponse.redirect(destino);
  }

  const respuesta = NextResponse.redirect(destino);
  respuesta.cookies.set(COOKIE_RECUPERACION, motivo === "invite" ? MARCA_INVITACION : "1", OPCIONES_RECUPERACION);
  return respuesta;
}
