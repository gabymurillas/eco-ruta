/**
 * Formato de magnitudes para textos en español.
 * Venezuela usa coma decimal, así que "1,2 km" y no "1.2 km".
 */

const METROS_POR_KILOMETRO = 1000;
const VELOCIDAD_CAMINATA_M_POR_MINUTO = 80;
const MINUTOS_POR_HORA = 60;

export function formatearDistancia(metros: number): string {
  if (metros < METROS_POR_KILOMETRO) {
    return `${Math.round(metros)} m`;
  }

  const kilometros = metros / METROS_POR_KILOMETRO;
  return `${kilometros.toFixed(1).replace(".", ",")} km`;
}

export function formatearMinutos(minutos: number): string {
  if (minutos < MINUTOS_POR_HORA) {
    return `${minutos} min`;
  }

  const horas = Math.floor(minutos / MINUTOS_POR_HORA);
  const resto = minutos % MINUTOS_POR_HORA;

  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
}

/** Cuánto tarda el ciudadano en llegar caminando hasta la parada. */
export function estimarCaminataMinutos(metros: number): number {
  return Math.max(1, Math.round(metros / VELOCIDAD_CAMINATA_M_POR_MINUTO));
}

const FORMATO_HORA = new Intl.DateTimeFormat("es-VE", {
  hour: "numeric",
  minute: "2-digit",
});

/** «3:42 p. m.»: la hora en que pasó algo, en el formato de Venezuela. */
export function formatearHora(fechaIso: string): string {
  return FORMATO_HORA.format(new Date(fechaIso));
}
