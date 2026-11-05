/**
 * Tema visual del panel de administración: claro u oscuro.
 *
 * Se guarda en una cookie y no en localStorage porque el servidor tiene que
 * leerla al armar la página: así el HTML ya llega con el tema elegido y no
 * parpadea en claro antes de pasar a oscuro.
 */

export type Tema = "claro" | "oscuro";

export const COOKIE_TEMA = "ecoruta-tema-admin";

/** Un año: es una preferencia de la persona, no un dato de sesión. */
export const DURACION_COOKIE_TEMA_S = 60 * 60 * 24 * 365;

/** Cualquier valor desconocido o ausente vuelve al claro, el tema por defecto. */
export function leerTema(valor: string | undefined): Tema {
  return valor === "oscuro" ? "oscuro" : "claro";
}

export function temaContrario(tema: Tema): Tema {
  return tema === "oscuro" ? "claro" : "oscuro";
}
