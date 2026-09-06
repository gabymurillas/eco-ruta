"use server";

import { redirect } from "next/navigation";
import { cerrarSesion, iniciarSesion } from "@/services/auth.service";

export type EstadoIngreso = {
  error?: string;
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
    return { error: "Escribe tu correo y tu contraseña." };
  }

  const resultado = await iniciarSesion({ correo, contrasena });

  if (!resultado.ok) {
    return { error: resultado.error };
  }

  redirect("/admin");
}

export async function salir(): Promise<void> {
  await cerrarSesion();
  redirect("/admin/ingreso");
}
