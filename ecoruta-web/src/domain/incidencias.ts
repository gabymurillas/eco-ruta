const ETIQUETA_POR_TIPO: Record<string, string> = {
  calle_cerrada: "Calle cerrada",
  falla_mecanica: "Falla mecánica",
  desvio: "Desvío",
  congestion: "Congestión",
  otro: "Observación del conductor",
};

/**
 * Un tipo que la base acepte y este mapa todavía no conozca se muestra tal cual
 * en vez de esconder la incidencia: verla con un nombre feo es mejor que no verla.
 */
export function etiquetarTipoIncidencia(tipo: string): string {
  return ETIQUETA_POR_TIPO[tipo] ?? tipo;
}

export type EstadoIncidencia = "activas" | "resueltas" | "todas";

export function leerEstadoIncidencia(valor: string | undefined): EstadoIncidencia {
  return valor === "resueltas" || valor === "todas" ? valor : "activas";
}

export const PERIODOS_DIAS = [7, 30, 90] as const;
export type PeriodoDias = (typeof PERIODOS_DIAS)[number];

export function leerPeriodo(valor: string | undefined): PeriodoDias {
  const numero = Number(valor);
  return PERIODOS_DIAS.find((dias) => dias === numero) ?? 7;
}

// El servidor de Vercel corre en UTC: sin la zona fija, un reporte de las 10 a. m.
// se leería como de las 2 p. m.
const ZONA = "America/Caracas";
const HORA = new Intl.DateTimeFormat("es-VE", { timeZone: ZONA, hour: "numeric", minute: "2-digit" });
const DIA = new Intl.DateTimeFormat("es-VE", { timeZone: ZONA, weekday: "short", day: "numeric", month: "short" });
const CLAVE_DIA = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" });

/** «Hoy, 10:42 a. m.», «ayer, 4:10 p. m.» o «lun 3 nov, 7:20 a. m.». */
export function formatearMomento(fechaIso: string, ahora: Date = new Date()): string {
  const fecha = new Date(fechaIso);
  const hora = HORA.format(fecha);
  const dia = CLAVE_DIA.format(fecha);

  if (dia === CLAVE_DIA.format(ahora)) {
    return `Hoy, ${hora}`;
  }

  if (dia === CLAVE_DIA.format(new Date(ahora.getTime() - 86_400_000))) {
    return `Ayer, ${hora}`;
  }

  return `${DIA.format(fecha).replace(/[.,]/g, "")}, ${hora}`;
}

const DOCE_HORAS_S = 12 * 3600;
const SEGUNDOS_POR_MINUTO = 60;
const SEGUNDOS_POR_HORA = 3600;

/** Lo reciente se lee mejor como «hace 12 min»; lo de hace más de medio día, con fecha. */
export function describirReporte(segundosDesdeReporte: number, creadaAt: string): string {
  if (segundosDesdeReporte < SEGUNDOS_POR_MINUTO) {
    return "hace un momento";
  }
  if (segundosDesdeReporte < SEGUNDOS_POR_HORA) {
    return `hace ${Math.floor(segundosDesdeReporte / SEGUNDOS_POR_MINUTO)} min`;
  }
  if (segundosDesdeReporte < DOCE_HORAS_S) {
    return `hace ${Math.floor(segundosDesdeReporte / SEGUNDOS_POR_HORA)} h`;
  }
  return formatearMomento(creadaAt);
}

export function filtrarPorEstado<T extends { activa: boolean }>(incidencias: T[], estado: EstadoIncidencia): T[] {
  if (estado === "todas") {
    return incidencias;
  }
  return incidencias.filter((incidencia) => incidencia.activa === (estado === "activas"));
}

export function contarPorEstado(incidencias: { activa: boolean }[]): Record<EstadoIncidencia, number> {
  const activas = incidencias.filter((incidencia) => incidencia.activa).length;
  return { activas, resueltas: incidencias.length - activas, todas: incidencias.length };
}
