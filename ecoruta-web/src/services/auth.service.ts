import { crearClienteServidor } from "@/lib/supabase/server";
import { exito, fallo, falloRegistrado, type Resultado } from "./resultado";

export type Administrador = {
  id: string;
  correo: string;
  esAdmin: boolean;
};

type Credenciales = {
  correo: string;
  contrasena: string;
  /** Desmarcado, la sesión termina al cerrar el navegador. */
  mantener: boolean;
};

/** Lo que trae el enlace del correo de recuperación: según la plantilla, uno u otro. */
export type EnlaceDeRecuperacion = { codigo: string } | { tokenHash: string };

const LONGITUD_MINIMA_CONTRASENA = 8;

export async function iniciarSesion({
  correo,
  contrasena,
  mantener,
}: Credenciales): Promise<Resultado<Administrador>> {
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

  const administrador = aAdministrador(data.user);

  if (!administrador.esAdmin) {
    await supabase.auth.signOut();
    return fallo("Esta cuenta no tiene permisos de administración.");
  }

  return exito(administrador);
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
 * Canjea el enlace del correo por una sesión de recuperación.
 *
 * Con la plantilla por defecto llega un `code` (PKCE): solo se puede canjear en el
 * mismo navegador donde se pidió, porque la otra mitad quedó en una cookie. Con la
 * plantilla que manda `token_hash` el enlace sirve desde cualquier navegador.
 */
export async function confirmarRecuperacion(enlace: EnlaceDeRecuperacion): Promise<Resultado<null>> {
  // Sesión corta: nace de un correo, y nadie eligió «Mantener la sesión».
  const supabase = await crearClienteServidor({ sesionCorta: true });
  const { data, error } =
    "codigo" in enlace
      ? await supabase.auth.exchangeCodeForSession(enlace.codigo)
      : await supabase.auth.verifyOtp({ type: "recovery", token_hash: enlace.tokenHash });

  if (error || !data.user) {
    return fallo("El enlace venció o ya se usó. Pide uno nuevo.");
  }

  // Igual que al ingresar: una cuenta sin rol de administración no se queda con
  // sesión en el panel. Se responde como un enlace inválido, sin dar detalles.
  if (!aAdministrador(data.user).esAdmin) {
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

/** Devuelve null si no hay sesión válida. Valida el token contra Supabase, no la cookie. */
export async function obtenerAdministrador(): Promise<Administrador | null> {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const administrador = aAdministrador(user);
  return administrador.esAdmin ? administrador : null;
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
function aAdministrador(usuario: UsuarioSupabase): Administrador {
  return {
    id: usuario.id,
    correo: usuario.email ?? "",
    esAdmin: usuario.app_metadata?.rol === "admin",
  };
}
