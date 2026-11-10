/**
 * Reglas de los valores calibrables.
 *
 * Los rangos no son cosmética: un valor fuera de ellos rompe el comportamiento del
 * sistema en producción, y el error solo se vería días después en forma de
 * notificaciones que no llegan o que llegan de más.
 */

export type ClaveParametro =
  | "permanencia_minima_s"
  | "histeresis_salida_s"
  | "radio_aproximacion_m"
  | "distancia_parada_trazado_m"
  | "exactitud_maxima_m"
  | "emision_movimiento_s"
  | "emision_detenido_s"
  | "sin_senal_umbral_s"
  | "bateria_alerta_pct"
  | "penalizacion_incidencia_pct";

export type DefinicionParametro = {
  clave: ClaveParametro;
  titulo: string;
  unidad: string;
  /** El mismo valor que siembra sql/02_parametros.sql: respaldo si la tabla no se puede leer. */
  porDefecto: number;
  minimo: number;
  maximo: number;
  grupo: "geocercas" | "transmision" | "tiempo";
  /** Por qué existe y qué pasa si se toca. */
  explicacion: string;
};

export const DEFINICIONES: readonly DefinicionParametro[] = [
  {
    clave: "permanencia_minima_s",
    titulo: "Permanencia mínima",
    unidad: "s",
    porDefecto: 45,
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
    porDefecto: 30,
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
    porDefecto: 500,
    minimo: 100,
    maximo: 2000,
    grupo: "geocercas",
    explicacion:
      "Distancia a la parada a la que se avisa al ciudadano que su unidad se acerca. Más grande le da más tiempo para caminar, pero avisa de buses que aún tardan.",
  },
  {
    clave: "distancia_parada_trazado_m",
    titulo: "Distancia parada–trazado",
    unidad: "m",
    porDefecto: 40,
    minimo: 10,
    maximo: 150,
    grupo: "geocercas",
    explicacion:
      "Una ruta pasa por las paradas que quedan a menos de esta distancia de su trazado. Más grande perdona un trazado dibujado a mano alzada, pero puede sumar paradas de una calle paralela.",
  },
  {
    clave: "exactitud_maxima_m",
    titulo: "Exactitud máxima",
    unidad: "m",
    porDefecto: 50,
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
    porDefecto: 5,
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
    porDefecto: 30,
    minimo: 5,
    maximo: 300,
    grupo: "transmision",
    explicacion: "Cada cuánto emite con el vehículo parado.",
  },
  {
    clave: "sin_senal_umbral_s",
    titulo: "Sin señal",
    unidad: "s",
    porDefecto: 300,
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
    porDefecto: 15,
    minimo: 5,
    maximo: 50,
    grupo: "transmision",
    explicacion:
      "Porcentaje que dispara la alerta en el monitoreo. El teléfono va enchufado, así que una batería que baja suele significar un cargador suelto.",
  },
  {
    clave: "penalizacion_incidencia_pct",
    titulo: "Margen por incidencia",
    unidad: "%",
    porDefecto: 25,
    minimo: 0,
    maximo: 200,
    grupo: "tiempo",
    explicacion:
      "Cuánto se alarga el tiempo estimado mientras la ruta tiene una incidencia sin resolver. Con 25, un estimado de 8 min pasa a 10 min. En 0 la incidencia se avisa pero no cambia el tiempo.",
  },
];

function definicionDe(clave: string): DefinicionParametro | undefined {
  return DEFINICIONES.find((definicion) => definicion.clave === clave);
}

export type ValoresParametros = Record<ClaveParametro, number>;

/**
 * Los valores vigentes, con el de fábrica para cualquier clave que falte. Una
 * pantalla que no pudo leer `parametros` sigue funcionando con los valores del
 * esquema en vez de romperse o inventar los suyos.
 */
export function valoresConRespaldo(
  filas: readonly { clave: string; valor: number }[],
): ValoresParametros {
  const leidos = new Map(filas.map(({ clave, valor }) => [clave, Number(valor)]));

  return Object.fromEntries(
    DEFINICIONES.map(({ clave, porDefecto }) => {
      const valor = leidos.get(clave);
      return [clave, valor !== undefined && Number.isFinite(valor) ? valor : porDefecto];
    }),
  ) as ValoresParametros;
}

type ErrorDeValidacion = {
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
