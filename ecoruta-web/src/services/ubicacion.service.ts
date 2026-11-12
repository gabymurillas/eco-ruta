import type { EstadoUbicacion, Ubicacion } from "@/features/seguimiento/types";

const TIEMPO_MAXIMO_MS = 10_000;

/**
 * Envuelve la API de geolocalización del navegador en una promesa.
 * Nunca rechaza: los tres desenlaces posibles (concedida, negada, no disponible)
 * son estados legítimos de la pantalla, no errores que haya que atrapar.
 */
export function obtenerUbicacionActual(): Promise<EstadoUbicacion> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve({ estado: "no_disponible" });
  }

  return new Promise((resolver) => {
    navigator.geolocation.getCurrentPosition(
      (posicion) =>
        resolver({
          estado: "concedida",
          ubicacion: {
            lat: posicion.coords.latitude,
            lng: posicion.coords.longitude,
            exactitudM: posicion.coords.accuracy,
          },
        }),
      // Solo el código 1 es un «no» del ciudadano. Tiempo agotado o sin posición
      // es el GPS, y se arregla reintentando, no tocando los permisos.
      (error) =>
        resolver({
          estado: error.code === error.PERMISSION_DENIED ? "negada" : "fallida",
        }),
      { enableHighAccuracy: true, timeout: TIEMPO_MAXIMO_MS },
    );
  });
}

/**
 * Si el ciudadano ya dio permiso en una visita anterior, la ubicación se puede
 * leer sin volver a preguntar. Sin esto, quien vuelve con su parada guardada
 * vería la parada sin la distancia caminando.
 *
 * Safari viejo no tiene `permissions.query` para geolocalización: ahí se
 * responde que no, y la parada se muestra sin distancia.
 */
export async function ubicacionYaPermitida(): Promise<boolean> {
  try {
    const permiso = await navigator.permissions.query({ name: "geolocation" });
    return permiso.state === "granted";
  } catch {
    return false;
  }
}

/**
 * Sigue la posición mientras la página está abierta, para que el punto azul se
 * mueva con el ciudadano. Solo se usa cuando ya dio permiso: nunca pregunta.
 * Devuelve la función que deja de vigilar.
 */
export function vigilarUbicacion(alMoverse: (ubicacion: Ubicacion) => void): () => void {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return () => {};
  }

  const id = navigator.geolocation.watchPosition(
    (posicion) =>
      alMoverse({
        lat: posicion.coords.latitude,
        lng: posicion.coords.longitude,
        exactitudM: posicion.coords.accuracy,
      }),
    // Un fallo suelto del GPS no borra la última posición buena.
    () => {},
    { enableHighAccuracy: true, maximumAge: 5_000 },
  );

  return () => navigator.geolocation.clearWatch(id);
}
