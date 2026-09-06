"use server";

import { revalidatePath } from "next/cache";
import { crearUnidad, generarCodigoDeVinculacion } from "@/services/unidades.service";

export type EstadoUnidades = {
  error?: string;
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
  return {};
}
