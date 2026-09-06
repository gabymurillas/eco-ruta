"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { TOKENS_DE_COLOR } from "@/domain/colores";
import { ICONOS_DISPONIBLES } from "@/domain/iconos";
import { actualizarRuta, crearRuta } from "@/services/rutas.service";

export type EstadoRuta = {
  error?: string;
};

export async function guardarRuta(
  _estadoPrevio: EstadoRuta,
  datos: FormData,
): Promise<EstadoRuta> {
  const id = String(datos.get("id") ?? "");
  const nombre = String(datos.get("nombre") ?? "").trim();
  const tipo = String(datos.get("tipo") ?? "").trim() || null;
  const icono = String(datos.get("icono") ?? "");
  const color = String(datos.get("color") ?? "");
  const horario = String(datos.get("horario") ?? "").trim() || null;

  if (!nombre) {
    return { error: "La ruta necesita un nombre." };
  }

  // El color y el ícono salen de listas cerradas del sistema de diseño, aunque el tipo
  // sea texto libre: un color fuera de la paleta rompe la distinción entre rutas.
  if (!TOKENS_DE_COLOR.includes(color)) {
    return { error: "Elige un color de la paleta." };
  }

  if (!(ICONOS_DISPONIBLES as readonly string[]).includes(icono)) {
    return { error: "Elige un ícono de la lista." };
  }

  const resultado = id
    ? await actualizarRuta(id, { nombre, tipo, icono, color, horario })
    : await crearRuta({ nombre, tipo, icono, color, horario });

  if (!resultado.ok) {
    return { error: resultado.error };
  }

  revalidatePath("/admin/rutas");
  redirect("/admin/rutas");
}
