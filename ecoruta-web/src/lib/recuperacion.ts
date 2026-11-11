/**
 * Marca de que esta sesión viene del enlace de un correo: recuperación o invitación.
 *
 * Sin ella, cualquiera frente a un navegador con la sesión abierta podría entrar
 * a «Elegir una contraseña nueva» y quedarse con la cuenta sin saber la actual.
 * La pone la ruta que canjea el enlace y se consume al guardar la contraseña.
 */
export const COOKIE_RECUPERACION = "ecoruta-recuperacion";

/**
 * Valor de la marca cuando el enlace era una invitación al equipo: la pantalla
 * dice «crea tu contraseña» en vez de «elige una nueva». No concede nada más.
 */
export const MARCA_INVITACION = "invitacion";

/** Lo que tiene la persona para elegir la contraseña después de abrir el enlace. */
const VIGENCIA_S = 15 * 60;

export const OPCIONES_RECUPERACION = {
  path: "/admin",
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: VIGENCIA_S,
};
