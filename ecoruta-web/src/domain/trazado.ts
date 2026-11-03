/**
 * Geometría del trazado asistido. Funciones puras: entran puntos, salen puntos.
 *
 * El admin marca pocos puntos clave y un servicio de rutas dibuja el camino por
 * las calles entre ellos. Lo que aquí se decide —dónde va un punto nuevo, qué
 * tramos se piden a ese servicio, cómo se limpia un recorrido GPS— no depende
 * del servicio, y por eso vive aparte.
 */

import type { Punto } from "./mapa";

export type PuntoClave = Punto & {
  /** El tramo que llega a este punto va en línea recta, no por las calles. */
  recto: boolean;
};

/** Un pedazo del trazado: o se pide al servicio de rutas, o va recto. */
export type Tramo = { tipo: "calles" | "recto"; puntos: Punto[] };

const RADIO_TIERRA_M = 6_371_000;

/** Distancia sobre la esfera. A escala de una ciudad el error es de centímetros. */
export function distanciaM(a: Punto, b: Punto): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;

  return 2 * RADIO_TIERRA_M * Math.asin(Math.sqrt(h));
}

/**
 * Dónde va un punto nuevo: entre los dos puntos clave donde menos alarga el
 * recorrido, o al final si ahí alarga menos. Así un clic junto a la línea la
 * corrige en ese tramo, y un clic lejos de todo la extiende.
 */
export function indiceDeInsercion(puntos: readonly Punto[], nuevo: Punto): number {
  if (puntos.length < 2) {
    return puntos.length;
  }

  let mejorIndice = puntos.length;
  let menorDesvio = distanciaM(puntos[puntos.length - 1], nuevo);

  for (let i = 1; i < puntos.length; i++) {
    const desvio =
      distanciaM(puntos[i - 1], nuevo) + distanciaM(nuevo, puntos[i]) - distanciaM(puntos[i - 1], puntos[i]);

    if (desvio < menorDesvio) {
      menorDesvio = desvio;
      mejorIndice = i;
    }
  }

  return mejorIndice;
}

/**
 * Agrupa los puntos clave en tramos: los seguidos que van por calles se piden
 * juntos al servicio de rutas, en una sola consulta; cada tramo recto se dibuja
 * tal cual. Los tramos comparten su punto de unión.
 */
export function tramosDelTrazado(puntos: readonly PuntoClave[]): Tramo[] {
  const tramos: Tramo[] = [];

  for (let i = 1; i < puntos.length; i++) {
    const tipo = puntos[i].recto ? "recto" : "calles";
    const anterior = tramos[tramos.length - 1];
    const destino = { lat: puntos[i].lat, lng: puntos[i].lng };

    if (anterior && anterior.tipo === tipo && tipo === "calles") {
      anterior.puntos.push(destino);
    } else {
      tramos.push({ tipo, puntos: [{ lat: puntos[i - 1].lat, lng: puntos[i - 1].lng }, destino] });
    }
  }

  return tramos;
}

/** Une las líneas de cada tramo sin repetir el punto donde se tocan. */
export function unirLineas(lineas: readonly (readonly Punto[])[]): Punto[] {
  const unida: Punto[] = [];

  for (const linea of lineas) {
    const inicio = unida.length > 0 && linea.length > 0 && mismoPunto(unida[unida.length - 1], linea[0]) ? 1 : 0;
    unida.push(...linea.slice(inicio));
  }

  return unida;
}

/**
 * Deja un punto cada `separacionM` metros. Un teléfono que transmite cada 5 s
 * en un semáforo manda decenas de lecturas en el mismo lugar; al servicio que
 * ajusta el recorrido a las calles solo le sirven las que avanzan.
 */
export function submuestrear<T extends Punto>(puntos: readonly T[], separacionM: number): T[] {
  if (puntos.length === 0) {
    return [];
  }

  const elegidos = [puntos[0]];

  for (const punto of puntos.slice(1)) {
    if (distanciaM(elegidos[elegidos.length - 1], punto) >= separacionM) {
      elegidos.push(punto);
    }
  }

  const ultimo = puntos[puntos.length - 1];
  return elegidos[elegidos.length - 1] === ultimo ? elegidos : [...elegidos, ultimo];
}

/**
 * Douglas–Peucker: los pocos puntos que conservan la forma de la línea. Sirve
 * para sacar puntos clave de un trazado que no los tiene (uno dibujado a mano o
 * uno sacado de un viaje), y poder editarlo después moviendo puntos.
 */
export function simplificar<T extends Punto>(linea: readonly T[], toleranciaM: number): T[] {
  if (linea.length <= 2) {
    return [...linea];
  }

  const ultimo = linea.length - 1;
  let mayor = 0;
  let indice = 0;

  for (let i = 1; i < ultimo; i++) {
    const separacion = distanciaASegmentoM(linea[i], linea[0], linea[ultimo]);

    if (separacion > mayor) {
      mayor = separacion;
      indice = i;
    }
  }

  if (mayor <= toleranciaM) {
    return [linea[0], linea[ultimo]];
  }

  const izquierda = simplificar(linea.slice(0, indice + 1), toleranciaM);
  const derecha = simplificar(linea.slice(indice), toleranciaM);
  return [...izquierda.slice(0, -1), ...derecha];
}

/**
 * Media móvil sobre `vecinos` lecturas a cada lado. El ruido del GPS reparte las
 * lecturas a ambos lados de la calle; promediarlas las devuelve al centro antes
 * de elegir puntos clave, que si caen en la calle de al lado provocan retornos.
 */
export function suavizar(puntos: readonly Punto[], vecinos: number): Punto[] {
  return puntos.map((_, i) => {
    const ventana = puntos.slice(Math.max(0, i - vecinos), i + vecinos + 1);
    return {
      lat: ventana.reduce((suma, p) => suma + p.lat, 0) / ventana.length,
      lng: ventana.reduce((suma, p) => suma + p.lng, 0) / ventana.length,
    };
  });
}

/** Un punto del recorrido grabado, con lo que la unidad llevaba andado al pasar por él. */
export type PuntoRecorrido = Punto & { acumuladoM: number };

const VECINOS_SUAVIZADO = 3;
const SEPARACION_M = 60;
const TOLERANCIA_M = 20;

/**
 * Los puntos clave de un viaje grabado: suavizado, uno cada 60 m, y solo los
 * que dan forma al recorrido. Con ruido de ±20 m deja 13 a 23 puntos en 3 a 6 km,
 * y el camino por calles entre ellos mide lo mismo que el real con 2 % de error.
 */
export function puntosClaveDeRecorrido(gps: readonly Punto[]): PuntoRecorrido[] {
  const muestras = submuestrear(suavizar(gps, VECINOS_SUAVIZADO), SEPARACION_M);
  let acumuladoM = 0;
  const conRecorrido = muestras.map((punto, i) => {
    acumuladoM += i === 0 ? 0 : distanciaM(muestras[i - 1], punto);
    return { ...punto, acumuladoM };
  });

  return simplificar(conRecorrido, TOLERANCIA_M);
}

/**
 * Cuánto más largo puede ser el camino por calles que lo que la unidad anduvo
 * de verdad. Más que eso es un punto que cayó en la calle equivocada.
 */
const DESVIO_MAXIMO = 1.5;
/** Por debajo de esto, un rodeo es una esquina, no un error. */
const DESVIO_MINIMO_M = 150;

/**
 * El punto clave que más rodeo provoca, o null si ninguno. `tramosM[i]` es lo
 * que mide por calles ir del punto i al i+1. Un punto en la calle equivocada
 * infla el tramo que llega y el que sale, y el camino da un retorno que la
 * unidad nunca hizo. Se compara con lo que anduvo, no con la línea recta: si
 * de verdad entró a una calle sin salida y volvió, ese rodeo se respeta.
 */
export function puntoQueDesvia(
  puntos: readonly PuntoRecorrido[],
  tramosM: readonly number[],
): number | null {
  let peor: number | null = null;
  let mayorExceso = 0;

  for (let i = 1; i < puntos.length - 1; i++) {
    const porCalles = tramosM[i - 1] + tramosM[i];
    const andado = puntos[i + 1].acumuladoM - puntos[i - 1].acumuladoM;
    const exceso = porCalles - andado * DESVIO_MAXIMO;

    if (porCalles - andado > DESVIO_MINIMO_M && exceso > mayorExceso) {
      mayorExceso = exceso;
      peor = i;
    }
  }

  return peor;
}

/** Distancia de un punto a un segmento, sobre un plano local: basta a escala de calle. */
function distanciaASegmentoM(punto: Punto, a: Punto, b: Punto): number {
  const metrosPorGradoLat = 111_320;
  const metrosPorGradoLng = metrosPorGradoLat * Math.cos((a.lat * Math.PI) / 180);
  const px = (punto.lng - a.lng) * metrosPorGradoLng;
  const py = (punto.lat - a.lat) * metrosPorGradoLat;
  const bx = (b.lng - a.lng) * metrosPorGradoLng;
  const by = (b.lat - a.lat) * metrosPorGradoLat;
  const largo2 = bx * bx + by * by;
  const t = largo2 === 0 ? 0 : Math.max(0, Math.min(1, (px * bx + py * by) / largo2));

  return Math.hypot(px - t * bx, py - t * by);
}

function mismoPunto(a: Punto, b: Punto): boolean {
  return Math.abs(a.lat - b.lat) < 1e-7 && Math.abs(a.lng - b.lng) < 1e-7;
}
