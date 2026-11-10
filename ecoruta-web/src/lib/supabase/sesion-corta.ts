import type { CookieOptions } from "@supabase/ssr";

/**
 * «Mantener la sesión» desmarcado: las cookies de Supabase se guardan sin
 * vencimiento, así el navegador las borra al cerrarse.
 *
 * La marca es una cookie de sesión también. Hace falta porque Supabase renueva el
 * token cada hora y vuelve a escribir sus cookies con `maxAge`: sin la marca, la
 * primera renovación volvería permanente una sesión que se pidió corta. Al cerrar
 * el navegador se van juntas, la marca y la sesión.
 *
 * Límite conocido: un navegador configurado para «continuar donde lo dejaste»
 * restaura también las cookies de sesión. Eso lo decide el navegador, no la web.
 */
export const COOKIE_SESION_CORTA = "ecoruta-sesion-corta";

// Legible desde el navegador a propósito: el cliente del navegador también renueva
// el token y necesita saber si la sesión es corta. Es solo una bandera, sin secreto.
export const OPCIONES_MARCA: CookieOptions = {
  path: "/",
  httpOnly: false,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
};

export function ajustarVencimiento(opciones: CookieOptions, sesionCorta: boolean): CookieOptions {
  // maxAge 0 es como Supabase borra una cookie al cerrar sesión: eso se respeta.
  if (!sesionCorta || !opciones.maxAge || opciones.maxAge <= 0) {
    return opciones;
  }

  const sinVencimiento = { ...opciones };
  delete sinVencimiento.maxAge;
  delete sinVencimiento.expires;
  return sinVencimiento;
}
