import { redirect } from "next/navigation";
import { puedeAdministrar } from "@/domain/roles";
import { obtenerSesionDelPanel, type SesionDelPanel } from "@/services/auth.service";

/**
 * Para las páginas que solo usa un administrador: a un operador lo devuelve a
 * `destino` en vez de mostrarle un formulario que no va a poder guardar.
 *
 * El menú ya no le ofrece esas secciones, pero la dirección se puede escribir a
 * mano. Las acciones repiten la verificación (`exigirAdministrador`) y RLS es la
 * barrera final.
 */
export async function exigirAdminOVolver(destino = "/admin"): Promise<SesionDelPanel> {
  const sesion = await obtenerSesionDelPanel();

  if (!sesion) {
    redirect("/admin/ingreso");
  }

  if (!puedeAdministrar(sesion.rol)) {
    redirect(destino);
  }

  return sesion;
}

/** Si quien mira puede crear, editar y borrar. Sin sesión, no. */
export async function puedeEditarElPanel(): Promise<boolean> {
  const sesion = await obtenerSesionDelPanel();
  return sesion !== null && puedeAdministrar(sesion.rol);
}
