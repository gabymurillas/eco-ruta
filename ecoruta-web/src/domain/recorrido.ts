/**
 * Lo que le falta a una unidad para llegar a cada parada de su ruta, a partir de
 * dónde va cada una sobre el trazado (metros desde el inicio, medidos por
 * PostGIS en `paradas_en_recorrido` y `unidades_en_recorrido`, sql/18).
 *
 * La medición queda en la base y la regla aquí, como con el tiempo estimado:
 * así una sola consulta sirve para todas las paradas de la ruta.
 */

export type Restante = { tipo: "falta"; metros: number } | { tipo: "ya_paso" };

export type EntradaRestante = {
  unidadM: number;
  paradaM: number;
  longitudM: number;
  circular: boolean;
  /** `distancia_parada_trazado_m`: la misma tolerancia con que se asignan las paradas. */
  toleranciaM: number;
};

/**
 * Mismas reglas que `llegadas_a_parada` (sql/14):
 *
 * - la parada está más adelante: la diferencia;
 * - quedó atrás en una ruta circular: se da la vuelta;
 * - quedó atrás por menos de la tolerancia: es la deriva del GPS con la unidad
 *   encima de la parada, se informa como 0;
 * - quedó atrás en una ruta abierta: ya pasó.
 */
export function restanteHastaParada({
  unidadM,
  paradaM,
  longitudM,
  circular,
  toleranciaM,
}: EntradaRestante): Restante {
  if (unidadM <= paradaM) {
    return { tipo: "falta", metros: paradaM - unidadM };
  }

  if (circular) {
    return { tipo: "falta", metros: longitudM - unidadM + paradaM };
  }

  if (unidadM - paradaM < toleranciaM) {
    return { tipo: "falta", metros: 0 };
  }

  return { tipo: "ya_paso" };
}

/**
 * Entre qué paradas va una unidad: el índice de la última que dejó atrás, o -1
 * si todavía no llega a la primera. Sirve para dibujarla en la lista, entre dos
 * paradas. Las paradas llegan ordenadas por avance.
 */
export function ultimaParadaDejada(paradasM: readonly number[], unidadM: number): number {
  let indice = -1;

  paradasM.forEach((paradaM, i) => {
    if (paradaM <= unidadM) {
      indice = i;
    }
  });

  return indice;
}
