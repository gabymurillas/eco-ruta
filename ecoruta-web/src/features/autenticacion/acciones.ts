"use server";

import { cookies, headers } from "next/headers";
import { COOKIE_RECUPERACION, OPCIONES_RECUPERACION } from "@/lib/recuperacion";
import { redirect } from "next/navigation";
import {
  cambiarContrasena,
  cerrarSesion,
  iniciarSesion,
  solicitarRestablecimiento,
} from "@/services/auth.service";

export type EstadoIngreso = {
  error?: string;
  /** Vuelve con el error: React limpia el formulario tras enviarlo y no hay que obligar a reescribirlo. */
  correo?: string;
};

/**
 * Server Action: la contraseña se valida en el servidor y nunca llega al bundle
 * del navegador. El formulario funciona incluso sin JavaScript.
 */
export async function ingresar(
  _estadoPrevio: EstadoIngreso,
  datos: FormData,
): Promise<EstadoIngreso> {
  const correo = String(datos.get("correo") ?? "").trim();
  const contrasena = String(datos.get("contrasena") ?? "");
  // Un checkbox desmarcado no viaja en el formulario.
  const mantener = datos.get("mantener") !== null;

  if (!correo || !contrasena) {
    return { error: "Escribe tu correo y tu contraseña.", correo };
  }

  const resultado = await iniciarSesion({ correo, contrasena, mantener });

  if (!resultado.ok) {
    return { error: resultado.error, correo };
  }

  redirect("/admin");
}

export async function salir(): Promise<void> {
  await cerrarSesion();
  redirect("/admin/ingreso");
}

export type EstadoRecuperacion = {
  error?: string;
  /** El correo al que se mandó el enlace: la pantalla lo nombra. */
  enviadoA?: string;
};

export async function pedirEnlace(
  _estadoPrevio: EstadoRecuperacion,
  datos: FormData,
): Promise<EstadoRecuperacion> {
  const correo = String(datos.get("correo") ?? "").trim();

  if (!correo) {
    return { error: "Escribe el correo de tu cuenta." };
  }

  // El enlace vuelve al mismo sitio desde donde se pidió (producción o local).
  // Supabase solo acepta destinos de su lista de URL permitidas.
  const origen = (await headers()).get("origin") ?? "";
  const resultado = await solicitarRestablecimiento(correo, `${origen}/admin/auth/confirmar`);

  return resultado.ok ? { enviadoA: correo } : { error: resultado.error };
}

export type EstadoContrasenaNueva = { error?: string };

export async function guardarContrasenaNueva(
  _estadoPrevio: EstadoContrasenaNueva,
  datos: FormData,
): Promise<EstadoContrasenaNueva> {
  const almacen = await cookies();

  // La página ya lo exige; aquí se repite porque una Server Action se puede
  // llamar sin pasar por la página.
  if (!almacen.has(COOKIE_RECUPERACION)) {
    return { error: "El enlace venció. Pide uno nuevo desde «¿Olvidaste la contraseña?»." };
  }

  const nueva = String(datos.get("contrasena") ?? "");
  const repetida = String(datos.get("repetida") ?? "");

  if (nueva !== repetida) {
    return { error: "Las dos contraseñas no coinciden." };
  }

  const resultado = await cambiarContrasena(nueva);

  if (!resultado.ok) {
    return { error: resultado.error };
  }

  // Un solo uso: para volver a cambiarla hay que pedir otro enlace.
  almacen.delete({ name: COOKIE_RECUPERACION, path: OPCIONES_RECUPERACION.path });
  redirect("/admin");
}
