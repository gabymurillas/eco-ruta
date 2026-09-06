import type { EstadoUbicacion } from "@/features/seguimiento/types";

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
      () => resolver({ estado: "negada" }),
      { enableHighAccuracy: true, timeout: TIEMPO_MAXIMO_MS },
    );
  });
}
