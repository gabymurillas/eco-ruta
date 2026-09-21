/**
 * Filtro de calidad y suavizado de telemetría GPS.
 *
 * Funciones puras: entran datos, salen datos. No hablan con la base ni con la red.
 * Están aisladas porque son, junto con `geocerca.ts`, las piezas que hay que
 * explicar y defender; dentro de un handler HTTP no se leen ni se prueban.
 *
 * La app de la ruta implementa estas mismas reglas en Kotlin. Si cambian aquí,
 * hay que avisarle: que el teléfono calcule distinto al servidor no falla
 * ruidosamente, solo produce notificaciones mal disparadas.
 */

export type Lectura = {
  lat: number;
  lng: number;
  exactitudM: number | null;
  capturadoAt: string;
};

export type Punto = {
  lat: number;
  lng: number;
};

/** Cuántas lecturas entran en el suavizado. */
export const VENTANA_DE_SUAVIZADO = 3;

/**
 * Una lectura sin exactitud reportada se considera usable: el teléfono no supo
 * estimarla, que no es lo mismo que haberla estimado mal. Descartarla dejaría
 * ciego al sistema en equipos que no informan ese dato.
 */
export function esUsable(exactitudM: number | null, exactitudMaximaM: number): boolean {
  return exactitudM === null || exactitudM <= exactitudMaximaM;
}

/**
 * Media ponderada de las últimas lecturas usables, de la más reciente a la más
 * vieja.
 *
 * El peso combina dos cosas. Por recencia (3, 2, 1) para que el punto suavizado
 * siga al vehículo en vez de quedarse atrás: promediar a peso igual con la
 * unidad en movimiento arrastra el punto decenas de metros hacia donde ya
 * estuvo, y eso retrasaría la entrada a la geocerca. Por exactitud (1/metros)
 * para que una lectura de 45 m pese menos que una de 5 m, que es lo que absorbe
 * la deriva.
 *
 * Con una sola lectura devuelve esa lectura: suavizar no inventa información.
 */
export function suavizar(usables: Lectura[]): Punto {
  if (usables.length === 0) {
    throw new Error("suavizar() necesita al menos una lectura usable.");
  }

  const ventana = usables.slice(0, VENTANA_DE_SUAVIZADO);

  let sumaLat = 0;
  let sumaLng = 0;
  let sumaPesos = 0;

  ventana.forEach((lectura, indice) => {
    const peso = pesoDe(lectura, ventana.length - indice);

    sumaLat += lectura.lat * peso;
    sumaLng += lectura.lng * peso;
    sumaPesos += peso;
  });

  return {
    lat: sumaLat / sumaPesos,
    lng: sumaLng / sumaPesos,
  };
}

/**
 * El piso de 1 metro evita dividir entre cero y que una exactitud absurdamente
 * optimista se lleve todo el peso.
 */
const EXACTITUD_MINIMA_M = 1;

/** Sin exactitud reportada se asume el piso: ni premia ni castiga la lectura. */
function pesoDe(lectura: Lectura, recencia: number): number {
  const exactitud = Math.max(lectura.exactitudM ?? EXACTITUD_MINIMA_M, EXACTITUD_MINIMA_M);

  return recencia / exactitud;
}
