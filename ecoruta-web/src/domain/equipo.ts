/**
 * Textos de la sección Equipo. Puro: recibe el «ahora» para poder probarse y
 * para que el servidor lo calcule una sola vez.
 */

const ZONA = "America/Caracas";
const MS_POR_DIA = 86_400_000;

const FECHA_CORTA = new Intl.DateTimeFormat("es-VE", {
  timeZone: ZONA,
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** Días de calendario en Caracas, no bloques de 24 horas: «ayer» es ayer aunque hayan pasado 3 horas. */
const DIA_DE_CALENDARIO = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA });

function diasDeCalendarioEntre(desde: Date, hasta: Date): number {
  const dia = (fecha: Date) => Date.parse(`${DIA_DE_CALENDARIO.format(fecha)}T00:00:00Z`);
  return Math.round((dia(hasta) - dia(desde)) / MS_POR_DIA);
}

/** «hoy», «ayer», «hace 5 días» y, pasada una semana, la fecha. */
export function describirCuando(instanteIso: string, ahora: Date): string {
  const instante = new Date(instanteIso);
  const dias = diasDeCalendarioEntre(instante, ahora);

  if (dias <= 0) return "hoy";
  if (dias === 1) return "ayer";
  if (dias <= 7) return `hace ${dias} días`;
  return `el ${FECHA_CORTA.format(instante)}`;
}

export function describirUltimoIngreso(instanteIso: string | null, ahora: Date): string {
  return instanteIso ? `Entró ${describirCuando(instanteIso, ahora)}` : "Todavía no entró";
}

/** Las dos primeras letras del correo, para el círculo de la fila. */
export function inicialesDeCorreo(correo: string): string {
  return correo.slice(0, 2).toUpperCase();
}
