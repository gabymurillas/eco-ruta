"use server";

import { esCaminataValida } from "@/domain/caminata";
import type { Punto } from "@/domain/mapa";
import { calcularCaminata, type Caminata } from "@/services/caminata.service";

export type ResultadoCaminata = { ok: true; caminata: Caminata } | { ok: false; error: string };

/**
 * Camino a pie del ciudadano hasta una parada. Es una Server Action para que
 * la clave del servicio de caminos se quede en el servidor.
 */
export async function pedirCaminata(desde: Punto, hasta: Punto): Promise<ResultadoCaminata> {
  if (!esCaminataValida(desde, hasta)) {
    return { ok: false, error: "La parada está demasiado lejos para ir caminando." };
  }

  const resultado = await calcularCaminata(desde, hasta);

  return resultado.ok ? { ok: true, caminata: resultado.datos } : { ok: false, error: resultado.error };
}
