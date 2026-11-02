/**
 * Reglas de los valores calibrables.
 *
 * Los rangos no son cosmética: un valor fuera de ellos rompe el comportamiento del
 * sistema en producción, y el error solo se vería días después en forma de
 * notificaciones que no llegan o que llegan de más.
 */

export type DefinicionParametro = {
  clave: string;
  titulo: string;
  unidad: string;
  minimo: number;
  maximo: number;
  grupo: "geocercas" | "transmision";
  /** Por qué existe y qué pasa si se toca. */
  explicacion: string;
};

export const DEFINICIONES: readonly DefinicionParametro[] = [
  {
    clave: "permanencia_minima_s",
    titulo: "Permanencia mínima",
    unidad: "s",
    minimo: 5,
    maximo: 300,
    grupo: "geocercas",
    explicacion:
      "Segundos dentro de la geocerca antes de notificar. Más bajo notifica antes, pero la deriva del GPS produce más falsos avisos.",
  },
  {
    clave: "histeresis_salida_s",
    titulo: "Histéresis de salida",
    unidad: "s",
    minimo: 5,
    maximo: 300,
    grupo: "geocercas",
    explicacion:
      "Segundos continuos fuera antes de dar por terminada la estadía. Si la unidad reentra antes, se considera que nunca salió.",
  },
  {
    clave: "radio_aproximacion_m",
    titulo: "Aviso de aproximación",
    unidad: "m",
    minimo: 100,
    maximo: 2000,
    grupo: "geocercas",
    explicacion:
      "Distancia a la parada a la que se avisa al ciudadano que su unidad se acerca. Más grande le da más tiempo para caminar, pero avisa de buses que aún tardan.",
  },
  {
    clave: "exactitud_maxima_m",
    titulo: "Exactitud máxima",
    unidad: "m",
    minimo: 5,
    maximo: 200,
    grupo: "geocercas",
    explicacion:
      "Lecturas con exactitud peor a esto se guardan pero no evalúan geocercas. Este número sale de la prueba de campo.",
  },
  {
    clave: "emision_movimiento_s",
    titulo: "En movimiento",
    unidad: "s",
    minimo: 1,
    maximo: 60,
    grupo: "transmision",
    explicacion:
      "Cada cuánto emite el teléfono con el vehículo andando. Es el que más pesa en el consumo de datos.",
  },
  {
    clave: "emision_detenido_s",
    titulo: "Detenido",
    unidad: "s",
    minimo: 5,
    maximo: 300,
    grupo: "transmision",
    explicacion: "Cada cuánto emite con el vehículo parado.",
  },
  {
    clave: "sin_senal_umbral_s",
    titulo: "Sin señal",
    unidad: "s",
    minimo: 60,
    maximo: 3600,
    grupo: "transmision",
    explicacion:
      "Segundos sin recibir posición antes de marcar la unidad como perdida y atenuar su tiempo estimado.",
  },
  {
    clave: "bateria_alerta_pct",
    titulo: "Alerta de batería",
    unidad: "%",
    minimo: 5,
    maximo: 50,
    grupo: "transmision",
    explicacion:
      "Porcentaje que dispara la alerta en el monitoreo. El teléfono va enchufado, así que una batería que baja suele significar un cargador suelto.",
  },
];

export function definicionDe(clave: string): DefinicionParametro | undefined {
  return DEFINICIONES.find((definicion) => definicion.clave === clave);
}

export type ErrorDeValidacion = {
  clave: string;
  mensaje: string;
};

export function validarParametros(
  valores: ReadonlyMap<string, number>,
): ErrorDeValidacion[] {
  const errores: ErrorDeValidacion[] = [];

  for (const [clave, valor] of valores) {
    const definicion = definicionDe(clave);

    if (!definicion) {
      continue;
    }

    if (!Number.isFinite(valor)) {
      errores.push({ clave, mensaje: "Escribe un número." });
      continue;
    }

    if (valor < definicion.minimo || valor > definicion.maximo) {
      errores.push({
        clave,
        mensaje: `Debe estar entre ${definicion.minimo} y ${definicion.maximo} ${definicion.unidad}.`,
      });
    }
  }

  return errores;
}

/**
 * El radio de geocerca menor que la exactitud del GPS no se dispara nunca: la lectura
 * cae fuera del círculo aunque el vehículo esté justo encima de la parada.
 * Se sugiere el doble de la exactitud para absorber la deriva.
 */
export function radioMinimoSugeridoM(exactitudMaximaM: number): number {
  return Math.round(exactitudMaximaM * 2);
}
