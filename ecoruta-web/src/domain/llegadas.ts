/**
 * Estado de una llegada desde el punto de vista del ciudadano que espera.
 *
 * La distinción que importa: "no hay nada circulando" y "venía una unidad y se quedó
 * muda" son situaciones distintas. En la primera el ciudadano no espera nada; en la
 * segunda ya está parado en la acera y el número que ve dejó de ser confiable.
 */

export type EstadoLlegada =
  | { tipo: "en_camino"; segundosSinSenal: number }
  | { tipo: "senal_perdida"; segundosSinSenal: number | null }
  | { tipo: "sin_recorrido" };

export type EntradaLlegada = {
  enViaje: boolean;
  segundosSinSenal: number | null;
  umbralSinSenalS: number;
};

export function evaluarLlegada({
  enViaje,
  segundosSinSenal,
  umbralSinSenalS,
}: EntradaLlegada): EstadoLlegada {
  if (!enViaje) {
    return { tipo: "sin_recorrido" };
  }

  // Un viaje abierto sin ninguna lectura es señal perdida, no "va llegando":
  // prometer un tiempo sin telemetría es peor que decir que no se sabe.
  if (segundosSinSenal === null || segundosSinSenal > umbralSinSenalS) {
    return { tipo: "senal_perdida", segundosSinSenal };
  }

  return { tipo: "en_camino", segundosSinSenal };
}

/**
 * Un tiempo estimado solo se muestra si la ruta tiene trazado y la señal está fresca.
 * Sin trazado la distancia no puede seguir el recorrido real, y en línea recta daría
 * un número que subestima siempre.
 */
export function puedeEstimarTiempo(
  estado: EstadoLlegada,
  rutaTieneTrazado: boolean,
): boolean {
  return estado.tipo === "en_camino" && rutaTieneTrazado;
}

/** "hace 4 min". Devuelve null cuando nunca hubo señal. */
export function describirAntiguedad(segundos: number | null): string | null {
  if (segundos === null) {
    return null;
  }

  if (segundos < 60) {
    return `hace ${segundos} s`;
  }

  if (segundos < 3600) {
    return `hace ${Math.floor(segundos / 60)} min`;
  }

  return `hace ${Math.floor(segundos / 3600)} h`;
}
