"use server";

import { revalidatePath } from "next/cache";
import {
  guardarTrazado,
  obtenerParadasDeRuta,
  type ParadaDeRuta,
} from "@/services/rutas.service";

export type ResultadoTrazado =
  | { ok: true; paradasDeRuta: ParadaDeRuta[] }
  | { ok: false; error: string };

/**
 * Coordenadas en orden GeoJSON [lng, lat], como las espera PostGIS.
 *
 * Devuelve las paradas que toca el trazado recién guardado: las calcula la base,
 * y el editor las muestra sin recargar para que el admin vea de inmediato por
 * dónde pasa la ruta.
 */
export async function guardarTrazadoDeRuta(
  rutaId: string,
  coordenadas: [number, number][],
): Promise<ResultadoTrazado> {
  if (coordenadas.length === 1) {
    return { ok: false, error: "Un trazado necesita al menos dos puntos." };
  }

  const guardado = await guardarTrazado(rutaId, coordenadas);

  if (!guardado.ok) {
    return { ok: false, error: guardado.error };
  }

  revalidatePath(`/admin/rutas/${rutaId}`);
  revalidatePath("/admin/rutas");
  revalidatePath("/admin/paradas");
  // El mapa del monitoreo dibuja el trazado de todas las rutas.
  revalidatePath("/admin");

  const paradas = await obtenerParadasDeRuta(rutaId);

  return paradas.ok
    ? { ok: true, paradasDeRuta: paradas.datos }
    : { ok: false, error: "El trazado se guardó, pero no se pudieron cargar sus paradas. Recarga la página." };
}
