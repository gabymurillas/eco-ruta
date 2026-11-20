"use server";

import { revalidatePath } from "next/cache";
import { validarLetrero } from "@/domain/catalogo-letreros";
import { exigirAdministrador } from "@/services/auth.service";
import {
  actualizarLetrero,
  crearLetrero,
  eliminarLetrero,
  guardarUnidadesDelLetrero,
} from "@/services/letreros.service";

export type EstadoLetreros = {
  error?: string;
  /** El letrero recién creado o editado: el panel se cierra al recibirlo. */
  guardado?: string;
};

/**
 * Cualquier cambio del catálogo puede cambiar el letrero vigente de una unidad,
 * y el monitoreo lo muestra junto a la ruta.
 */
function revalidar() {
  revalidatePath("/admin/letreros");
  revalidatePath("/admin");
}

export async function guardarLetrero(
  _estadoPrevio: EstadoLetreros,
  datos: FormData,
): Promise<EstadoLetreros> {
  const permiso = await exigirAdministrador();

  if (!permiso.ok) {
    return { error: permiso.error };
  }

  const letreroId = String(datos.get("letreroId") ?? "");
  const validacion = validarLetrero(String(datos.get("nombre") ?? ""), String(datos.get("orden") ?? ""));

  if (!validacion.ok) {
    return { error: validacion.error };
  }

  const cambios = { nombre: validacion.nombre, orden: validacion.orden, activo: datos.get("activo") === "on" };
  const resultado = letreroId
    ? await actualizarLetrero(letreroId, cambios)
    : await crearLetrero(cambios);

  if (!resultado.ok) {
    return { error: resultado.error };
  }

  revalidar();
  return { guardado: letreroId || (resultado.datos ?? "") };
}

export async function cambiarActivo(letreroId: string, activo: boolean): Promise<{ error?: string }> {
  const permiso = await exigirAdministrador();

  if (!permiso.ok) {
    return { error: permiso.error };
  }

  const resultado = await actualizarLetrero(letreroId, { activo });

  if (!resultado.ok) {
    return { error: resultado.error };
  }

  revalidar();
  return {};
}

export async function eliminar(letreroId: string): Promise<{ error?: string }> {
  const permiso = await exigirAdministrador();

  if (!permiso.ok) {
    return { error: permiso.error };
  }

  const resultado = await eliminarLetrero(letreroId);

  if (!resultado.ok) {
    return { error: resultado.error };
  }

  revalidar();
  return {};
}

export async function guardarUnidades(
  _estadoPrevio: EstadoLetreros,
  datos: FormData,
): Promise<EstadoLetreros> {
  const permiso = await exigirAdministrador();

  if (!permiso.ok) {
    return { error: permiso.error };
  }

  const letreroId = String(datos.get("letreroId") ?? "");
  const unidadIds = datos.getAll("unidadId").map(String).filter(Boolean);

  if (!letreroId) {
    return { error: "No se indicó el letrero." };
  }

  const resultado = await guardarUnidadesDelLetrero(letreroId, unidadIds);

  if (!resultado.ok) {
    return { error: resultado.error };
  }

  revalidar();
  return { guardado: letreroId };
}
