"use server";

import { redirect } from "next/navigation";
import { cerrarSesion, iniciarSesion } from "@/services/auth.service";

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

  if (!correo || !contrasena) {
    return { error: "Escribe tu correo y tu contraseña.", correo };
  }

  const resultado = await iniciarSesion({ correo, contrasena });

  if (!resultado.ok) {
    return { error: resultado.error, correo };
  }

  redirect("/admin");
}

export async function salir(): Promise<void> {
  await cerrarSesion();
  redirect("/admin/ingreso");
}
