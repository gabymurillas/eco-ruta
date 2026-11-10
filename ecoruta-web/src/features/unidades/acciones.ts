"use server";

import { revalidatePath } from "next/cache";
import {
  actualizarUnidad,
  crearUnidad,
  eliminarUnidad,
  generarCodigoDeVinculacion,
} from "@/services/unidades.service";

export type EstadoUnidades = {
  error?: string;
  /** La unidad que se acaba de crear o editar: el panel la deja elegida. */
  guardada?: string;
  codigo?: { unidadId: string; codigo: string; expiraEn: string };
};

export async function vincular(
  _estadoPrevio: EstadoUnidades,
  datos: FormData,
): Promise<EstadoUnidades> {
  const unidadId = String(datos.get("unidadId") ?? "");

  if (!unidadId) {
    return { error: "No se indicó la unidad." };
  }

  const resultado = await generarCodigoDeVinculacion(unidadId);

  if (!resultado.ok) {
    return { error: resultado.error };
  }

  revalidatePath("/admin/unidades");

  return { codigo: { unidadId, ...resultado.datos } };
}

export async function agregarUnidad(
  _estadoPrevio: EstadoUnidades,
  datos: FormData,
): Promise<EstadoUnidades> {
  const nombre = String(datos.get("nombre") ?? "").trim();
  const rutaId = String(datos.get("rutaId") ?? "") || null;

  if (!nombre) {
    return { error: "Escribe un nombre para la unidad." };
  }

  const resultado = await crearUnidad(nombre, rutaId);

  if (!resultado.ok) {
    return { error: resultado.error };
  }

  revalidatePath("/admin/unidades");
  return { guardada: resultado.datos };
}

export async function editarUnidad(
  _estadoPrevio: EstadoUnidades,
  datos: FormData,
): Promise<EstadoUnidades> {
  const unidadId = String(datos.get("unidadId") ?? "");
  const nombre = String(datos.get("nombre") ?? "").trim();
  const rutaId = String(datos.get("rutaId") ?? "") || null;

  if (!unidadId) {
    return { error: "No se indicó la unidad." };
  }

  if (!nombre) {
    return { error: "Escribe un nombre para la unidad." };
  }

  const resultado = await actualizarUnidad(unidadId, nombre, rutaId);

  if (!resultado.ok) {
    return { error: resultado.error };
  }

  revalidatePath("/admin/unidades");
  revalidatePath("/admin");
  return { guardada: unidadId };
}

export async function eliminar(unidadId: string): Promise<{ error?: string }> {
  const resultado = await eliminarUnidad(unidadId);

  if (!resultado.ok) {
    return { error: resultado.error };
  }

  revalidatePath("/admin/unidades");
  return {};
}
