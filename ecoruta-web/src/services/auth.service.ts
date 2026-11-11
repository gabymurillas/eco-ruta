import { cache } from "react";
import { leerRolDelPanel, puedeAdministrar, type RolDelPanel } from "@/domain/roles";
import { crearClienteServidor } from "@/lib/supabase/server";
import { exito, fallo, falloRegistrado, type Resultado } from "./resultado";

/** Quien tiene la sesión abierta en el panel, con el rol que decide qué puede hacer. */
export type SesionDelPanel = {
  id: string;
  correo: string;
  rol: RolDelPanel;
};

type Credenciales = {
  correo: string;
  contrasena: string;
  /** Desmarcado, la sesión termina al cerrar el navegador. */
  mantener: boolean;
};

/** De qué correo viene el enlace: «olvidé la contraseña» o la invitación al equipo. */
export type MotivoDelEnlace = "recovery" | "invite";

/**
 * Lo que trae el enlace del correo. Un `code` (PKCE) solo existe en la
 * recuperación; con `token_hash` el motivo dice qué clase de enlace canjear.
 */
export type EnlaceDelCorreo = { codigo: string } | { tokenHash: string; motivo: MotivoDelEnlace };

const LONGITUD_MINIMA_CONTRASENA = 8;

export async function iniciarSesion({
  correo,
  contrasena,
  mantener,
}: Credenciales): Promise<Resultado<SesionDelPanel>> {
  const supabase = await crearClienteServidor({ sesionCorta: !mantener });

  const { data, error } = await supabase.auth.signInWithPassword({
    email: correo,
    password: contrasena,
  });

  if (error || !data.user) {
    // No se distingue "correo inexistente" de "contraseña incorrecta":
    // decirlo permitiría averiguar qué correos están registrados.
    return fallo("Correo o contraseña incorrectos.");
  }

  const sesion = aSesionDelPanel(data.user);

  if (!sesion) {
    await supabase.auth.signOut();
    return fallo("Esta cuenta no tiene acceso al panel.");
  }

  return exito(sesion);
}

export async function cerrarSesion(): Promise<void> {
  // false borra la marca de sesión corta: la próxima vez se elige de nuevo.
  const supabase = await crearClienteServidor({ sesionCorta: false });
  await supabase.auth.signOut();
}

/**
 * Pide a Supabase el correo con el enlace para elegir otra contraseña.
 *
 * Responde igual exista o no la cuenta: decir «ese correo no está registrado»
 * permitiría averiguar qué correos tienen acceso al panel. Por eso tampoco se
 * informa el límite de envíos (429): Supabase solo lo aplica a cuentas que
 * existen, y avisarlo las delataría. Solo una caída del servicio (5xx o sin red)
 * se informa. Todo error queda en el registro: un SMTP mal configurado o una URL
 * de retorno que falta en la lista de Supabase se ven ahí y no en la pantalla.
 */
export async function solicitarRestablecimiento(correo: string, urlDeRetorno: string): Promise<Resultado<null>> {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.resetPasswordForEmail(correo, { redirectTo: urlDeRetorno });

  if (!error) {
    return exito(null);
  }

  console.error("[ecoruta] restablecer contraseña:", error);
  const caidaDelServicio = error.status === undefined || error.status >= 500;

  return caidaDelServicio
    ? fallo("No se pudo enviar el correo. Intenta de nuevo en unos minutos.")
    : exito(null);
}

/**
 * Canjea el enlace del correo —recuperación o invitación— por una sesión que solo
 * sirve para elegir la contraseña.
 *
 * Con la plantilla por defecto de recuperación llega un `code` (PKCE): solo se
 * puede canjear en el mismo navegador donde se pidió, porque la otra mitad quedó
 * en una cookie. Con la plantilla que manda `token_hash` el enlace sirve desde
 * cualquier navegador. Una invitación la abre otra persona en otro equipo, así
 * que solo funciona con `token_hash`: ver «Configurar Supabase» en
 * docs/04-arquitectura/README.md.
 */
export async function confirmarEnlaceDelCorreo(enlace: EnlaceDelCorreo): Promise<Resultado<null>> {
  // Sesión corta: nace de un correo, y nadie eligió «Mantener la sesión».
  const supabase = await crearClienteServidor({ sesionCorta: true });
  const { data, error } =
    "codigo" in enlace
      ? await supabase.auth.exchangeCodeForSession(enlace.codigo)
      : await supabase.auth.verifyOtp({ type: enlace.motivo, token_hash: enlace.tokenHash });

  if (error || !data.user) {
    return fallo("El enlace venció o ya se usó. Pide uno nuevo.");
  }

  // Igual que al ingresar: una cuenta sin rol del panel (la de un teléfono, por
  // ejemplo) no se queda con sesión. Se responde como un enlace inválido, sin
  // dar detalles.
  if (!aSesionDelPanel(data.user)) {
    await supabase.auth.signOut();
    return fallo("El enlace venció o ya se usó. Pide uno nuevo.");
  }

  return exito(null);
}

export async function cambiarContrasena(nueva: string): Promise<Resultado<null>> {
  if (nueva.length < LONGITUD_MINIMA_CONTRASENA) {
    return fallo(`La contraseña necesita al menos ${LONGITUD_MINIMA_CONTRASENA} caracteres.`);
  }

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.updateUser({ password: nueva });

  if (error?.code === "same_password") {
    return fallo("Es la misma contraseña de antes. Elige otra.");
  }

  if (error?.code === "weak_password") {
    return fallo("Esa contraseña es demasiado fácil de adivinar. Elige otra.");
  }

  if (error) {
    return falloRegistrado("cambiar contraseña", error, "No se pudo guardar la contraseña. Pide un enlace nuevo.");
  }

  return exito(null);
}

/**
 * Devuelve null si no hay sesión válida o la cuenta no tiene rol del panel.
 *
 * Valida el token contra Supabase, no la cookie: el rol que devuelve es el que la
 * cuenta tiene ahora, así que un cambio de rol o una baja se notan en la
 * siguiente petición aunque el token viejo siga vigente.
 *
 * `cache` lo comparte dentro de una misma petición: el layout, la página y sus
 * guardas preguntan lo mismo y Supabase se consulta una sola vez.
 */
export const obtenerSesionDelPanel = cache(async (): Promise<SesionDelPanel | null> => {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ? aSesionDelPanel(user) : null;
});

/**
 * Para las Server Actions que solo puede usar un administrador. Una acción se
 * puede invocar sin pasar por la página, así que el botón oculto no alcanza.
 * RLS la frenaría igual; esto responde antes y con un mensaje claro.
 */
export async function exigirAdministrador(): Promise<Resultado<SesionDelPanel>> {
  const sesion = await obtenerSesionDelPanel();

  if (!sesion) {
    return fallo("Tu sesión venció. Vuelve a entrar.");
  }

  return puedeAdministrar(sesion.rol)
    ? exito(sesion)
    : fallo("Tu rol no permite hacer este cambio. Pídeselo a un administrador.");
}

type UsuarioSupabase = {
  id: string;
  email?: string;
  app_metadata: Record<string, unknown>;
};

/**
 * El rol vive en `app_metadata`, que solo se modifica desde el servidor.
 * `user_metadata` no sirve: el propio usuario puede editarlo y se auto-nombraría admin.
 */
function aSesionDelPanel(usuario: UsuarioSupabase): SesionDelPanel | null {
  const rol = leerRolDelPanel(usuario.app_metadata?.rol);

  return rol ? { id: usuario.id, correo: usuario.email ?? "", rol } : null;
}
