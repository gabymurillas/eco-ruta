import { leerRolDelPanel, type RolDelPanel } from "@/domain/roles";
import { crearClienteServidor } from "@/lib/supabase/server";
import { exito, fallo, falloRegistrado, type Resultado } from "./resultado";

export type MiembroDelEquipo = {
  id: string;
  correo: string;
  rol: RolDelPanel;
  ultimoIngresoAt: string | null;
  invitadoAt: string | null;
  /** Se le mandó la invitación y todavía no abrió el enlace. */
  invitacionPendiente: boolean;
};

export type Equipo = {
  miembros: MiembroDelEquipo[];
  /** La cuenta de quien mira: su fila no lleva acciones. */
  tuId: string;
};

type Peticion =
  | { accion: "listar" }
  | { accion: "invitar"; correo: string; rol: RolDelPanel; urlDeRetorno: string }
  | { accion: "reenviar"; usuarioId: string; urlDeRetorno: string }
  | { accion: "cambiar_rol"; usuarioId: string; rol: RolDelPanel }
  | { accion: "quitar"; usuarioId: string };

const FUNCION = "gestionar-equipo";

/**
 * Todo lo del equipo pasa por la Edge Function `gestionar-equipo`: listar cuentas,
 * invitar, cambiar el rol y quitar el acceso usan la API de administración de
 * Auth, que exige la clave `service_role`. Esa clave no entra en la web (ADR-0015):
 * aquí solo viaja el token de la sesión, y la función verifica que sea de un
 * administrador antes de hacer nada.
 */
async function llamar<T>(peticion: Peticion, mensajeDeFallo: string): Promise<Resultado<T>> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.functions.invoke<T>(FUNCION, { body: peticion });

  if (!error) {
    return exito(data as T);
  }

  // Un rechazo de la función (4xx) trae su motivo en español, listo para mostrar.
  const motivo = await leerMotivo(error);

  if (motivo) {
    return fallo(motivo);
  }

  // Sin motivo: la función no está desplegada, se cayó o no hubo red.
  return falloRegistrado(`${FUNCION} (${peticion.accion})`, error, mensajeDeFallo);
}

/** El cuerpo `{ error }` de una respuesta 4xx de la función; null si no lo hay. */
async function leerMotivo(error: unknown): Promise<string | null> {
  const respuesta = (error as { context?: unknown }).context;

  if (!(respuesta instanceof Response) || respuesta.status >= 500 || respuesta.status === 404) {
    return null;
  }

  try {
    const cuerpo: unknown = await respuesta.json();
    const motivo = (cuerpo as { error?: unknown })?.error;
    return typeof motivo === "string" && motivo ? motivo : null;
  } catch {
    return null;
  }
}

export async function obtenerEquipo(): Promise<Resultado<Equipo>> {
  const resultado = await llamar<{ miembros?: unknown[]; tuId?: unknown }>(
    { accion: "listar" },
    "No se pudo cargar el equipo.",
  );

  if (!resultado.ok) {
    return resultado;
  }

  return exito({
    miembros: (resultado.datos?.miembros ?? []).flatMap(aMiembro),
    tuId: String(resultado.datos?.tuId ?? ""),
  });
}

/** Una fila sin rol del panel se descarta: la interfaz nunca muestra un rol inventado. */
function aMiembro(fila: unknown): MiembroDelEquipo[] {
  const { id, correo, rol, ultimoIngresoAt, invitadoAt, invitacionPendiente } = fila as Record<string, unknown>;
  const rolLeido = leerRolDelPanel(rol);

  if (typeof id !== "string" || !rolLeido) {
    return [];
  }

  return [
    {
      id,
      correo: String(correo ?? ""),
      rol: rolLeido,
      ultimoIngresoAt: typeof ultimoIngresoAt === "string" ? ultimoIngresoAt : null,
      invitadoAt: typeof invitadoAt === "string" ? invitadoAt : null,
      invitacionPendiente: invitacionPendiente === true,
    },
  ];
}

export async function invitarAlEquipo(
  correo: string,
  rol: RolDelPanel,
  urlDeRetorno: string,
): Promise<Resultado<null>> {
  const resultado = await llamar({ accion: "invitar", correo, rol, urlDeRetorno }, "No se pudo enviar la invitación.");
  return resultado.ok ? exito(null) : resultado;
}

/** Devuelve el correo al que se reenvió. */
export async function reenviarInvitacion(usuarioId: string, urlDeRetorno: string): Promise<Resultado<string>> {
  const resultado = await llamar<{ correo?: string }>(
    { accion: "reenviar", usuarioId, urlDeRetorno },
    "No se pudo reenviar la invitación.",
  );
  return resultado.ok ? exito(resultado.datos?.correo ?? "") : resultado;
}

export async function cambiarRolDeMiembro(usuarioId: string, rol: RolDelPanel): Promise<Resultado<null>> {
  const resultado = await llamar({ accion: "cambiar_rol", usuarioId, rol }, "No se pudo cambiar el rol.");
  return resultado.ok ? exito(null) : resultado;
}

export async function quitarAccesoDeMiembro(usuarioId: string): Promise<Resultado<null>> {
  const resultado = await llamar({ accion: "quitar", usuarioId }, "No se pudo quitar el acceso.");
  return resultado.ok ? exito(null) : resultado;
}
