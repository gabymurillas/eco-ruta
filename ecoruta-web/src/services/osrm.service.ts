import type { Punto } from "@/domain/mapa";
import { exito, fallo, falloRegistrado, type Resultado } from "./resultado";

/**
 * OSRM calcula caminos sobre las calles de OpenStreetMap, los mismos datos del
 * mapa. Es gratis y no pide clave; el servidor público es para uso moderado, y
 * el editor lo consulta solo cuando el admin mueve un punto. Si algún día no
 * alcanza, se instala uno propio cambiando esta URL.
 *
 * Perfil de auto: respeta el sentido de las calles, que es lo que hace un bus.
 */
const OSRM = "https://router.project-osrm.org";

type Geometria = { coordinates: [number, number][] };

export type Camino = {
  linea: Punto[];
  /** Lo que mide por calles cada tramo entre dos puntos seguidos. */
  tramosM: number[];
};

/** El camino por las calles que pasa por los puntos, en orden. */
export async function rutearPorCalles(
  puntos: readonly Punto[],
  senal?: AbortSignal,
): Promise<Resultado<Camino>> {
  const url = `${OSRM}/route/v1/driving/${aCoordenadas(puntos)}?overview=full&geometries=geojson`;
  const respuesta = await consultar<{
    routes?: { geometry: Geometria; legs: { distance: number }[] }[];
  }>(url, senal);

  if (!respuesta.ok) {
    return respuesta;
  }

  const ruta = respuesta.datos.routes?.[0];

  if (!ruta) {
    return falloRegistrado(
      "osrm_route",
      respuesta.datos,
      "No hay un camino por las calles entre esos puntos. Mueve el punto a una calle o usa un tramo recto.",
    );
  }

  return exito({ linea: desdeGeoJson(ruta.geometry), tramosM: ruta.legs.map((leg) => leg.distance) });
}

async function consultar<T>(url: string, senal?: AbortSignal): Promise<Resultado<T>> {
  try {
    const respuesta = await fetch(url, { signal: senal });

    // OSRM contesta 400 con un JSON que explica el motivo (NoRoute, NoMatch…).
    if (!respuesta.ok && respuesta.status !== 400) {
      return falloRegistrado("osrm", respuesta.status, "El servicio de rutas no responde. Prueba en un momento.");
    }

    return exito((await respuesta.json()) as T);
  } catch (causa) {
    // Una consulta cancelada porque el admin volvió a mover un punto no es un error.
    if (senal?.aborted) {
      return fallo("Cancelada.");
    }

    return falloRegistrado("osrm", causa, "No hay conexión con el servicio de rutas.");
  }
}

/** OSRM, como GeoJSON, espera longitud primero. */
function aCoordenadas(puntos: readonly Punto[]): string {
  return puntos.map((p) => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`).join(";");
}

function desdeGeoJson({ coordinates }: Geometria): Punto[] {
  return coordinates.map(([lng, lat]) => ({ lat, lng }));
}
