"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { leerRolDelPanel } from "@/domain/roles";
import { exigirAdministrador } from "@/services/auth.service";
import {
  cambiarRolDeMiembro,
  invitarAlEquipo,
  quitarAccesoDeMiembro,
  reenviarInvitacion,
} from "@/services/equipo.service";

/**
 * Acciones de Equipo. Cada una verifica aquí que quien llama sea administrador
 * y la Edge Function lo vuelve a verificar contra Auth: una Server Action se
 * puede invocar sin pasar por la página, y esta sección es la que reparte accesos.
 */

export type EstadoInvitacion = {
  error?: string;
  /** El correo al que se mandó: la pantalla lo nombra. */
  enviadaA?: string;
  /** Vuelve con el error para no obligar a reescribirlo. */
  correo?: string;
};

export type ResultadoDeEquipo = { error?: string; enviadaA?: string };

/**
 * El enlace del correo vuelve al mismo sitio desde donde se invitó (producción o
 * local). Supabase solo acepta destinos de su lista de Redirect URLs.
 */
async function urlDeRetorno(): Promise<string> {
  const origen = (await headers()).get("origin") ?? "";
  return `${origen}/admin/auth/confirmar`;
}

export async function invitar(_estadoPrevio: EstadoInvitacion, datos: FormData): Promise<EstadoInvitacion> {
  const correo = String(datos.get("correo") ?? "").trim().toLowerCase();
  const rol = leerRolDelPanel(datos.get("rol"));
  const permiso = await exigirAdministrador();

  if (!permiso.ok) {
    return { error: permiso.error, correo };
  }

  if (!correo) {
    return { error: "Escribe el correo de la persona.", correo };
  }

  if (!rol) {
    return { error: "Elige un rol.", correo };
  }

  const resultado = await invitarAlEquipo(correo, rol, await urlDeRetorno());

  if (!resultado.ok) {
    return { error: resultado.error, correo };
  }

  revalidatePath("/admin/equipo");
  return { enviadaA: correo };
}

export async function reenviar(usuarioId: string): Promise<ResultadoDeEquipo> {
  const permiso = await exigirAdministrador();

  if (!permiso.ok) {
    return { error: permiso.error };
  }

  const resultado = await reenviarInvitacion(usuarioId, await urlDeRetorno());

  // Reenviar borra la cuenta pendiente y crea otra: la lista cambió aunque falle a medias.
  revalidatePath("/admin/equipo");
  return resultado.ok ? { enviadaA: resultado.datos } : { error: resultado.error };
}

export async function cambiarRol(usuarioId: string, rolElegido: string): Promise<ResultadoDeEquipo> {
  const permiso = await exigirAdministrador();
  const rol = leerRolDelPanel(rolElegido);

  if (!permiso.ok) {
    return { error: permiso.error };
  }

  if (!rol) {
    return { error: "Elige un rol." };
  }

  // La regla también vive en la función; aquí ahorra el viaje y da el mismo mensaje.
  if (usuarioId === permiso.datos.id) {
    return { error: "No puedes cambiar tu propio rol. Pídeselo a otro administrador." };
  }

  const resultado = await cambiarRolDeMiembro(usuarioId, rol);

  revalidatePath("/admin/equipo");
  return resultado.ok ? {} : { error: resultado.error };
}

export async function quitarAcceso(usuarioId: string): Promise<ResultadoDeEquipo> {
  const permiso = await exigirAdministrador();

  if (!permiso.ok) {
    return { error: permiso.error };
  }

  if (usuarioId === permiso.datos.id) {
    return { error: "No puedes quitarte el acceso a ti mismo. Pídeselo a otro administrador." };
  }

  const resultado = await quitarAccesoDeMiembro(usuarioId);

  revalidatePath("/admin/equipo");
  return resultado.ok ? {} : { error: resultado.error };
}
