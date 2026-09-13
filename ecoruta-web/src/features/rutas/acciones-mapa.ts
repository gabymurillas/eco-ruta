"use server";

import { revalidatePath } from "next/cache";
import { radioMinimoSugeridoM } from "@/domain/parametros";
import {
  agregarParadaARuta,
  eliminarParadaDeRuta,
  guardarTrazado,
  moverParadaDeRuta,
  renombrarParadaDeRuta,
} from "@/services/rutas.service";
import { obtenerParametros } from "@/services/parametros.service";

export type ResultadoAccion = {
  ok: boolean;
  error?: string;
  paradaId?: string;
};

type NuevaParada = {
  rutaId: string;
  nombre: string;
  lat: number;
  lng: number;
  radioM: number;
};

export async function agregarParada(datos: NuevaParada): Promise<ResultadoAccion> {
  const nombre = datos.nombre.trim();

  if (!nombre) {
    return { ok: false, error: "La parada necesita un nombre." };
  }

  const minimo = await radioMinimoDelSistema();

  if (datos.radioM < minimo) {
    return {
      ok: false,
      error: `El radio no puede ser menor que ${minimo} m, el mínimo sugerido por la exactitud del GPS.`,
    };
  }

  const resultado = await agregarParadaARuta({ ...datos, nombre });

  if (!resultado.ok) {
    return { ok: false, error: resultado.error };
  }

  revalidarRuta(datos.rutaId);
  return { ok: true, paradaId: resultado.datos };
}

type CambioDeParada = {
  rutaId: string;
  paradaId: string;
  lat: number;
  lng: number;
  radioM: number;
};

export async function moverParada({
  rutaId,
  ...cambio
}: CambioDeParada): Promise<ResultadoAccion> {
  const resultado = await moverParadaDeRuta(cambio);

  if (!resultado.ok) {
    return { ok: false, error: resultado.error };
  }

  revalidarRuta(rutaId);
  return { ok: true };
}

export async function renombrarParada(
  rutaId: string,
  paradaId: string,
  nombre: string,
): Promise<ResultadoAccion> {
  const limpio = nombre.trim();

  if (!limpio) {
    return { ok: false, error: "La parada necesita un nombre." };
  }

  const resultado = await renombrarParadaDeRuta(paradaId, limpio);

  if (!resultado.ok) {
    return { ok: false, error: resultado.error };
  }

  revalidarRuta(rutaId);
  return { ok: true };
}

export async function eliminarParada(
  rutaId: string,
  paradaId: string,
): Promise<ResultadoAccion> {
  const resultado = await eliminarParadaDeRuta(paradaId);

  if (!resultado.ok) {
    return { ok: false, error: resultado.error };
  }

  revalidarRuta(rutaId);
  return { ok: true };
}

/** Coordenadas en orden GeoJSON [lng, lat], como las espera PostGIS. */
export async function guardarTrazadoDeRuta(
  rutaId: string,
  coordenadas: [number, number][],
): Promise<ResultadoAccion> {
  if (coordenadas.length === 1) {
    return { ok: false, error: "Un trazado necesita al menos dos puntos." };
  }

  const resultado = await guardarTrazado(rutaId, coordenadas);

  if (!resultado.ok) {
    return { ok: false, error: resultado.error };
  }

  revalidarRuta(rutaId);
  return { ok: true };
}

/**
 * Un radio menor que la exactitud del GPS no se dispara nunca: la lectura cae fuera del
 * círculo aunque el vehículo esté encima de la parada. Se valida en el servidor y no
 * solo en el formulario, porque la acción se puede invocar sin pasar por la interfaz.
 */
async function radioMinimoDelSistema(): Promise<number> {
  const parametros = await obtenerParametros();

  if (!parametros.ok) {
    return 0;
  }

  const exactitud = parametros.datos.find((p) => p.clave === "exactitud_maxima_m");

  return exactitud ? radioMinimoSugeridoM(Number(exactitud.valor)) : 0;
}

function revalidarRuta(rutaId: string) {
  revalidatePath(`/admin/rutas/${rutaId}`);
  revalidatePath("/admin/rutas");
  // El mapa del monitoreo dibuja el trazado y las paradas de todas las rutas.
  revalidatePath("/admin");
}
