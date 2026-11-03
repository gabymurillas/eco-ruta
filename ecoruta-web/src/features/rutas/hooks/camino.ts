import type { Punto } from "@/domain/mapa";
import {
  puntoQueDesvia,
  puntosClaveDeRecorrido,
  tramosDelTrazado,
  unirLineas,
  type PuntoClave,
} from "@/domain/trazado";
import { exito, type Resultado } from "@/services/resultado";
import { rutearPorCalles } from "@/services/osrm.service";

/** Cada punto quitado es una consulta más a OSRM: sin tope, un GPS muy malo no terminaría. */
const MAXIMO_PUNTOS_QUITADOS = 40;

/**
 * La línea que pasa por los puntos clave: por las calles, salvo los tramos
 * marcados como rectos.
 */
export async function calcularCamino(
  puntos: readonly PuntoClave[],
  senal?: AbortSignal,
): Promise<Resultado<Punto[]>> {
  if (puntos.length < 2) {
    return exito(puntos.map(({ lat, lng }) => ({ lat, lng })));
  }

  const lineas: Punto[][] = [];

  for (const tramo of tramosDelTrazado(puntos)) {
    if (tramo.tipo === "recto") {
      lineas.push(tramo.puntos);
      continue;
    }

    const camino = await rutearPorCalles(tramo.puntos, senal);

    if (!camino.ok) {
      return camino;
    }

    lineas.push(camino.datos.linea);
  }

  return exito(unirLineas(lineas));
}

/**
 * El trazado que sale de un viaje grabado. Se reduce el GPS a puntos clave y se
 * piden las calles entre ellos; mientras algún punto obligue a un rodeo que la
 * unidad no anduvo —cayó en la calle de al lado por el ruido—, se quita y se
 * vuelve a pedir. Queda como cualquier trazado por puntos: editable.
 */
export async function caminoDesdeRecorrido(
  gps: readonly Punto[],
): Promise<Resultado<{ puntos: PuntoClave[]; linea: Punto[] }>> {
  let puntos = puntosClaveDeRecorrido(gps);

  for (let quitados = 0; quitados <= MAXIMO_PUNTOS_QUITADOS; quitados++) {
    const camino = await rutearPorCalles(puntos);

    if (!camino.ok) {
      return camino;
    }

    const desvia = puntoQueDesvia(puntos, camino.datos.tramosM);

    if (desvia === null) {
      return exito({
        puntos: puntos.map(({ lat, lng }) => ({ lat, lng, recto: false })),
        linea: camino.datos.linea,
      });
    }

    puntos = puntos.filter((_, indice) => indice !== desvia);
  }

  return {
    ok: false,
    error: "El GPS de ese viaje tiene demasiado ruido para sacar un trazado. Usa los puntos clave.",
  };
}
