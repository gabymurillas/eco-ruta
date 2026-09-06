import { crearClienteServidor } from "@/lib/supabase/server";
import { exito, fallo, type Resultado } from "./resultado";

export type Administrador = {
  id: string;
  correo: string;
  esAdmin: boolean;
};

type Credenciales = {
  correo: string;
  contrasena: string;
};

export async function iniciarSesion({
  correo,
  contrasena,
}: Credenciales): Promise<Resultado<Administrador>> {
  const supabase = await crearClienteServidor();

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
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
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
