/**
 * Cálculo del tiempo estimado de llegada.
 *
 * Es un estimado, no una predicción: divide la distancia que le falta a la unidad
 * entre una velocidad de referencia. No usa históricos ni modelos.
 */

/**
 * Piso de velocidad. Sin él, una unidad detenida en un semáforo da una velocidad
 * cercana a cero y el tiempo estimado se dispara al infinito.
 */
const VELOCIDAD_MINIMA_KMH = 8;

const METROS_POR_KILOMETRO = 1000;
const MINUTOS_POR_HORA = 60;

export type EntradaEta = {
  /** Distancia sobre el trazado real de la ruta, no en línea recta. */
  distanciaRestanteM: number;
  /** Promedio de las últimas posiciones usables de la unidad. */
  velocidadPromedioKmh: number;
  /** Factor >= 1 que aplica una incidencia activa sobre la ruta. */
  penalizacionIncidencia?: number;
};

export function calcularEtaEstimadoMinutos({
  distanciaRestanteM,
  velocidadPromedioKmh,
  penalizacionIncidencia = 1,
}: EntradaEta): number {
  const velocidadUsada = Math.max(velocidadPromedioKmh, VELOCIDAD_MINIMA_KMH);
  const distanciaKm = distanciaRestanteM / METROS_POR_KILOMETRO;
  const horas = distanciaKm / velocidadUsada;

  return Math.ceil(horas * MINUTOS_POR_HORA * penalizacionIncidencia);
}

/**
 * Velocidad de referencia: promedio de las últimas lecturas usables.
 * Las lecturas sin velocidad reportada se descartan en vez de contarse como cero,
 * porque un cero falso hunde el promedio y alarga el tiempo estimado.
 */
export function calcularVelocidadReferenciaKmh(
  velocidades: readonly (number | null)[],
): number {
  const reportadas = velocidades.filter(
    (velocidad): velocidad is number => velocidad !== null,
  );

  if (reportadas.length === 0) {
    return VELOCIDAD_MINIMA_KMH;
  }

  const suma = reportadas.reduce((total, velocidad) => total + velocidad, 0);
  return suma / reportadas.length;
}
