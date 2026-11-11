"use server";

import { revalidatePath } from "next/cache";
import { radioMinimoSugeridoM } from "@/domain/parametros";
import { exigirAdministrador } from "@/services/auth.service";
import {
  actualizarParada,
  crearParada,
  eliminarParada as borrarParada,
  type ParadaDeLaCiudad,
} from "@/services/catalogo-paradas.service";
import { obtenerValoresDeParametros } from "@/services/parametros.service";

export type ResultadoAccion = {
  ok: boolean;
  error?: string;
  paradaId?: string;
};

type DatosDeParada = Pick<ParadaDeLaCiudad, "nombre" | "lat" | "lng" | "radioM" | "notifica">;

export async function agregarParada(datos: DatosDeParada): Promise<ResultadoAccion> {
  const permiso = await exigirAdministrador();

  if (!permiso.ok) {
    return { ok: false, error: permiso.error };
  }

  const nombre = datos.nombre.trim();
  const invalida = await validarParada(nombre, datos.radioM);

  if (invalida) {
    return invalida;
  }

  const resultado = await crearParada({ ...datos, nombre });

  if (!resultado.ok) {
    return { ok: false, error: resultado.error };
  }

  revalidarParadas();
  return { ok: true, paradaId: resultado.datos };
}

export async function guardarParada(
  paradaId: string,
  datos: DatosDeParada,
): Promise<ResultadoAccion> {
  const permiso = await exigirAdministrador();

  if (!permiso.ok) {
    return { ok: false, error: permiso.error };
  }

  const nombre = datos.nombre.trim();
  const invalida = await validarParada(nombre, datos.radioM);

  if (invalida) {
    return invalida;
  }

  const resultado = await actualizarParada(paradaId, { ...datos, nombre });

  if (!resultado.ok) {
    return { ok: false, error: resultado.error };
  }

  revalidarParadas();
  return { ok: true, paradaId };
}

export async function eliminarParada(paradaId: string): Promise<ResultadoAccion> {
  const permiso = await exigirAdministrador();

  if (!permiso.ok) {
    return { ok: false, error: permiso.error };
  }

  const resultado = await borrarParada(paradaId);

  if (!resultado.ok) {
    return { ok: false, error: resultado.error };
  }

  revalidarParadas();
  return { ok: true };
}

/**
 * Lo mismo que muestra la ficha, repetido aquí: la acción se puede invocar sin
 * pasar por la interfaz.
 */
async function validarParada(
  nombre: string,
  radioM: number,
): Promise<ResultadoAccion | null> {
  if (!nombre) {
    return { ok: false, error: "La parada necesita un nombre." };
  }

  const minimo = await radioMinimoDelSistema();

  if (radioM < minimo) {
    return {
      ok: false,
      error: `El radio no puede ser menor que ${minimo} m, el mínimo sugerido por la exactitud del GPS.`,
    };
  }

  return null;
}

/**
 * Un radio menor que la exactitud del GPS no se dispara nunca: la lectura cae
 * fuera del círculo aunque el vehículo esté encima de la parada.
 */
async function radioMinimoDelSistema(): Promise<number> {
  const parametros = await obtenerValoresDeParametros();
  return radioMinimoSugeridoM(parametros.exactitud_maxima_m);
}

/** Cambiar una parada cambia qué rutas la tocan: se refrescan todas las vistas que las muestran. */
function revalidarParadas() {
  revalidatePath("/admin/paradas");
  revalidatePath("/admin/rutas", "layout");
  revalidatePath("/admin");
}
