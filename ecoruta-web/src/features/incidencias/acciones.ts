"use server";

import { revalidatePath } from "next/cache";
import { resolverIncidencia } from "@/services/incidencias.service";

export async function marcarResuelta(id: string): Promise<{ error?: string }> {
  const resultado = await resolverIncidencia(id);

  // Se revalida también si ya estaba resuelta: la vista estaba vieja.
  revalidatePath("/admin/incidencias");
  revalidatePath("/admin");

  return resultado.ok ? {} : { error: resultado.error };
}
