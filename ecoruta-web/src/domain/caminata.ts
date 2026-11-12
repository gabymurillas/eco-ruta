import { CENTRO_SAN_JUAN, type Punto } from "./mapa";
import { distanciaM } from "./trazado";

/**
 * Límites de lo que se le pide al servicio de caminos. La acción es pública
 * (el ciudadano no inicia sesión): sin esto, cualquiera podría gastar la cuota
 * diaria pidiendo caminos de otra ciudad.
 */
const RADIO_CIUDAD_M = 25_000;
const CAMINATA_MAXIMA_M = 6_000;

export function esCaminataValida(desde: Punto, hasta: Punto): boolean {
  return (
    esPunto(desde) &&
    esPunto(hasta) &&
    distanciaM(desde, CENTRO_SAN_JUAN) <= RADIO_CIUDAD_M &&
    distanciaM(hasta, CENTRO_SAN_JUAN) <= RADIO_CIUDAD_M &&
    distanciaM(desde, hasta) <= CAMINATA_MAXIMA_M
  );
}

function esPunto(valor: Punto): boolean {
  return Number.isFinite(valor?.lat) && Number.isFinite(valor?.lng);
}
