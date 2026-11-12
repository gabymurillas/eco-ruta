import type { Punto } from "@/domain/mapa";
import { exito, falloRegistrado, type Resultado } from "./resultado";

/**
 * Camino a pie por las calles, con openrouteservice (HeiGIT). OSRM público, el
 * que usa el editor de rutas, solo calcula en auto: a pie importan los atajos,
 * las aceras y que el sentido de las calles no cuenta.
 *
 * Solo se llama desde el servidor (una Server Action): la clave no lleva
 * `NEXT_PUBLIC_`, así que nunca llega al navegador. El plan gratuito da 2.000
 * caminos al día y 40 por minuto.
 */
const ORS = "https://api.heigit.org/openrouteservice/v2/directions/foot-walking/geojson";
const TIEMPO_MAXIMO_MS = 8_000;

export type Caminata = {
  linea: Punto[];
  distanciaM: number;
  duracionS: number;
};

type RespuestaOrs = {
  features?: {
    geometry: { coordinates: [number, number][] };
    properties: { summary: { distance?: number; duration?: number } };
  }[];
};

export async function calcularCaminata(desde: Punto, hasta: Punto): Promise<Resultado<Caminata>> {
  const clave = process.env.ORS_API_KEY;

  if (!clave) {
    return falloRegistrado("ors", "Falta ORS_API_KEY", "El cálculo del camino a pie no está disponible.");
  }

  try {
    const respuesta = await fetch(ORS, {
      method: "POST",
      headers: { Authorization: clave, "Content-Type": "application/json" },
      // GeoJSON: longitud primero.
      body: JSON.stringify({ coordinates: [[desde.lng, desde.lat], [hasta.lng, hasta.lat]] }),
      signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
      cache: "no-store",
    });

    if (!respuesta.ok) {
      return falloRegistrado(
        "ors",
        `${respuesta.status} ${await respuesta.text()}`,
        respuesta.status === 429
          ? "Muchas consultas a la vez. Prueba en un minuto."
          : "No encontramos un camino a pie hasta la parada.",
      );
    }

    const camino = ((await respuesta.json()) as RespuestaOrs).features?.[0];

    if (!camino) {
      return falloRegistrado("ors", "sin features", "No encontramos un camino a pie hasta la parada.");
    }

    return exito({
      linea: camino.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
      distanciaM: camino.properties.summary.distance ?? 0,
      duracionS: camino.properties.summary.duration ?? 0,
    });
  } catch (causa) {
    return falloRegistrado("ors", causa, "No hay conexión con el servicio de caminos. Prueba en un momento.");
  }
}
