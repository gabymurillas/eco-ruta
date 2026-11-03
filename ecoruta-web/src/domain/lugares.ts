/**
 * Lugares que el admin busca para ubicar una parada. Funciones puras.
 */

import type { Punto } from "./mapa";

export type Lugar = Punto & {
  id: string;
  nombre: string;
  /** Barrio, ciudad y estado: lo que distingue dos «Plaza Bolívar». */
  detalle: string;
};

/** «9.911, -67.354» o «9.911 -67.354», como las copia Google Maps. */
const CON_PUNTO = /^(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)$/;
/** «9,911; -67,354» o «9,911 -67,354»: con coma decimal el separador no puede ser coma. */
const CON_COMA = /^(-?\d+(?:,\d+)?)\s*[;\s]\s*(-?\d+(?:,\d+)?)$/;

/** Coordenadas pegadas desde Google Maps u otra app. Lo demás no son coordenadas. */
export function leerCoordenadas(texto: string): Punto | null {
  const limpio = texto.trim();
  const coincidencia = CON_PUNTO.exec(limpio) ?? CON_COMA.exec(limpio);

  if (!coincidencia) {
    return null;
  }

  const lat = Number(coincidencia[1].replace(",", "."));
  const lng = Number(coincidencia[2].replace(",", "."));

  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return null;
  }

  return { lat, lng };
}
