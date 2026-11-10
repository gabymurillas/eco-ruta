/**
 * Reglas de la pantalla de históricos. Funciones puras: entran filas, salen filas.
 */

export const PERIODOS = [7, 30] as const;
export type Periodo = (typeof PERIODOS)[number];

const ZONA = "America/Caracas";
const MS_POR_DIA = 86_400_000;

// en-CA da «2026-11-04»: la misma forma que devuelve la base para un `date`.
const CLAVE_DIA = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function leerPeriodo(valor: string | undefined): Periodo {
  return PERIODOS.find((periodo) => String(periodo) === valor) ?? PERIODOS[0];
}

/**
 * Los días del período en la hora de Caracas, del más viejo a hoy. Se generan
 * aquí porque la base solo devuelve los días con viajes: sin esto, un domingo
 * sin servicio desaparecería del gráfico en vez de verse en cero.
 */
export function diasDelPeriodo(dias: number, ahora: Date): string[] {
  return Array.from({ length: dias }, (_, indice) =>
    CLAVE_DIA.format(new Date(ahora.getTime() - (dias - 1 - indice) * MS_POR_DIA)),
  );
}

export type FilaViajesPorDia = {
  dia: string;
  ruta_id: string;
  viajes: number;
};

export type DiaApilado = {
  dia: string;
  total: number;
  /** En el orden de `rutaIds`: cada ruta ocupa siempre el mismo lugar de la pila. */
  segmentos: { rutaId: string; viajes: number }[];
};

export function apilarPorDia(
  filas: readonly FilaViajesPorDia[],
  dias: readonly string[],
  rutaIds: readonly string[],
): DiaApilado[] {
  return dias.map((dia) => {
    const delDia = filas.filter((fila) => fila.dia === dia);
    const segmentos = rutaIds
      .map((rutaId) => ({
        rutaId,
        viajes: delDia.find((fila) => fila.ruta_id === rutaId)?.viajes ?? 0,
      }))
      .filter((segmento) => segmento.viajes > 0);

    return { dia, total: segmentos.reduce((suma, s) => suma + s.viajes, 0), segmentos };
  });
}

const FECHA_CORTA = new Intl.DateTimeFormat("es-VE", { day: "numeric", month: "short", timeZone: "UTC" });
const ANIO = new Intl.DateTimeFormat("es-VE", { year: "numeric", timeZone: "UTC" });

/**
 * «28 oct al 3 nov de 2026», o «27 dic de 2025 al 2 ene de 2026» si cruza el año.
 * Las claves ya están en hora de Caracas: se leen como UTC.
 */
export function describirRango(dias: readonly string[]): string {
  const desde = new Date(`${dias[0]}T00:00:00Z`);
  const hasta = new Date(`${dias[dias.length - 1]}T00:00:00Z`);
  const anioDesde = ANIO.format(desde);
  const anioHasta = ANIO.format(hasta);
  const inicio = limpiar(FECHA_CORTA.format(desde)) + (anioDesde === anioHasta ? "" : ` de ${anioDesde}`);

  return `${inicio} al ${limpiar(FECHA_CORTA.format(hasta))} de ${anioHasta}`;
}

const DIA_SEMANA = new Intl.DateTimeFormat("es-VE", { weekday: "short", timeZone: "UTC" });

/** «Lun», «Mié». */
export function etiquetaDiaSemana(dia: string): string {
  const texto = limpiar(DIA_SEMANA.format(new Date(`${dia}T00:00:00Z`)));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** «4», el número del día: con treinta barras no cabe el nombre. */
export function etiquetaNumeroDia(dia: string): string {
  return String(Number(dia.slice(8)));
}

function limpiar(texto: string): string {
  return texto.replace(/\./g, "");
}
