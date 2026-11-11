import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";
import {
  aMiembros,
  esCorreoValido,
  leerRolDelPanel,
  normalizarCorreo,
  validarCambio,
  type Cambio,
  type CuentaDeAuth,
  type Miembro,
  type RolDelPanel,
} from "../_dominio/equipo.ts";

/**
 * Equipo del panel: listar las cuentas, invitar por correo, cambiar el rol y
 * quitar el acceso (ADR-0015).
 *
 * Por qué es una Edge Function y no código de la web: todo esto usa la API de
 * administración de Supabase Auth, que exige la clave `service_role`. Esa clave
 * salta RLS por completo y por regla del proyecto no entra en la web ni en el
 * APK; vive solo aquí, donde Supabase la inyecta.
 *
 * Quién puede llamarla: solo una cuenta con `app_metadata.rol = 'admin'`. El rol
 * no se lee del token que llega, sino de la cuenta tal como está ahora en Auth
 * (`getUser` la consulta): a un admin al que le bajaron el rol hace un minuto su
 * token viejo ya no le sirve aquí.
 *
 * La llama el servidor de la web (Server Actions) con el token de la sesión; no
 * hay cabeceras CORS porque ningún navegador debe llamarla directamente.
 */

type ClienteAdmin = SupabaseClient;

/** Cuentas por página al recorrer Auth, y tope de páginas para no girar sin fin. */
const CUENTAS_POR_PAGINA = 200;
const PAGINAS_MAXIMAS = 50;

class Rechazo extends Error {
  constructor(readonly estado: number, mensaje: string) {
    super(mensaje);
  }
}

Deno.serve(async (peticion) => {
  if (peticion.method !== "POST") {
    return responder(405, { error: "Método no permitido." });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  try {
    const actorId = await exigirAdministrador(admin, peticion);
    const cuerpo = await leerCuerpo(peticion);

    return responder(200, await ejecutar(admin, actorId, cuerpo));
  } catch (error) {
    if (error instanceof Rechazo) {
      return responder(error.estado, { error: error.message });
    }

    console.error("[ecoruta] gestionar-equipo:", error);
    return responder(500, { error: "No se pudo completar la operación. Intenta de nuevo." });
  }
});

/** Devuelve el id de quien llama, o rechaza si no es un administrador vigente. */
async function exigirAdministrador(admin: ClienteAdmin, peticion: Request): Promise<string> {
  const token = (peticion.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");

  if (!token) {
    throw new Rechazo(401, "Inicia sesión para continuar.");
  }

  const { data, error } = await admin.auth.getUser(token);

  if (error || !data.user) {
    throw new Rechazo(401, "Tu sesión venció. Vuelve a entrar.");
  }

  if (leerRolDelPanel(data.user.app_metadata?.rol) !== "admin") {
    throw new Rechazo(403, "Solo un administrador puede gestionar el equipo.");
  }

  return data.user.id;
}

type Cuerpo = Record<string, unknown>;

async function leerCuerpo(peticion: Request): Promise<Cuerpo> {
  try {
    const cuerpo = await peticion.json();
    return cuerpo && typeof cuerpo === "object" ? cuerpo : {};
  } catch {
    return {};
  }
}

function ejecutar(admin: ClienteAdmin, actorId: string, cuerpo: Cuerpo): Promise<unknown> {
  switch (cuerpo.accion) {
    case "listar":
      return listar(admin, actorId);
    case "invitar":
      return invitar(admin, cuerpo);
    case "reenviar":
      return reenviar(admin, cuerpo);
    case "cambiar_rol":
      return cambiarRol(admin, actorId, cuerpo);
    case "quitar":
      return quitar(admin, actorId, cuerpo);
    default:
      throw new Rechazo(400, "Acción desconocida.");
  }
}

async function listar(admin: ClienteAdmin, actorId: string) {
  return { miembros: await leerMiembros(admin), tuId: actorId };
}

/**
 * Auth no filtra por `app_metadata`: se recorren todas las cuentas y se separan
 * aquí. Son pocas —el equipo y un teléfono por unidad—, así que no pesa.
 */
async function leerMiembros(admin: ClienteAdmin): Promise<Miembro[]> {
  const cuentas: CuentaDeAuth[] = [];

  for (let pagina = 1; pagina <= PAGINAS_MAXIMAS; pagina++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page: pagina,
      perPage: CUENTAS_POR_PAGINA,
    });

    if (error) {
      throw error;
    }

    cuentas.push(...data.users);

    if (data.users.length < CUENTAS_POR_PAGINA) {
      break;
    }
  }

  return aMiembros(cuentas);
}

async function invitar(admin: ClienteAdmin, cuerpo: Cuerpo) {
  const correo = normalizarCorreo(cuerpo.correo);
  const rol = leerRolDelPanel(cuerpo.rol);

  if (!esCorreoValido(correo)) {
    throw new Rechazo(400, "Escribe un correo válido.");
  }

  if (!rol) {
    throw new Rechazo(400, "Elige un rol: administrador u operador.");
  }

  await enviarInvitacion(admin, { correo, rol, urlDeRetorno: leerUrlDeRetorno(cuerpo) });
  return { correo };
}

/** Destino del enlace del correo. Supabase solo acepta los de su lista de Redirect URLs. */
function leerUrlDeRetorno(cuerpo: Cuerpo): string {
  const url = String(cuerpo.urlDeRetorno ?? "");

  if (!/^https?:\/\//.test(url)) {
    throw new Rechazo(400, "Falta la dirección de retorno de la invitación.");
  }

  return url;
}

/**
 * Crea la cuenta, manda el correo y recién entonces le pone el rol.
 *
 * Solo se invita a correos sin cuenta. Darle rol a una cuenta que ya existía
 * sería regalarle el panel a quien la haya creado antes con ese correo y una
 * contraseña propia (el registro público de Supabase no confirma de quién es).
 *
 * El rol va en `app_metadata`: el segundo argumento de la invitación (`data`)
 * escribe `user_metadata`, que la propia persona puede editar. Si ponerle el rol
 * falla, la cuenta se borra: sin rol no entra a nada, pero dejaría el correo
 * ocupado y la invitación no se podría repetir.
 */
async function enviarInvitacion(
  admin: ClienteAdmin,
  { correo, rol, urlDeRetorno }: { correo: string; rol: RolDelPanel; urlDeRetorno: string },
): Promise<void> {
  const { data, error } = await admin.auth.admin.inviteUserByEmail(correo, {
    redirectTo: urlDeRetorno,
  });

  if (error || !data.user) {
    throw rechazoDeInvitacion(error);
  }

  const { error: errorDeRol } = await admin.auth.admin.updateUserById(data.user.id, {
    app_metadata: { rol },
  });

  if (errorDeRol) {
    console.error("[ecoruta] rol de la cuenta invitada:", errorDeRol);
    await admin.auth.admin.deleteUser(data.user.id);
    throw new Rechazo(500, "No se pudo completar la invitación. Intenta de nuevo.");
  }
}

function rechazoDeInvitacion(
  error: { status?: number; code?: string; message?: string } | null,
): Rechazo {
  console.error("[ecoruta] invitar:", error);

  if (error?.code === "email_exists" || /already been registered/i.test(error?.message ?? "")) {
    return new Rechazo(409, "Ya existe una cuenta con ese correo.");
  }

  if (error?.status === 429) {
    return new Rechazo(429, "Se alcanzó el límite de correos por hora. Intenta más tarde.");
  }

  return new Rechazo(500, "No se pudo enviar la invitación. Revisa el correo e intenta de nuevo.");
}

/**
 * Supabase no reenvía una invitación a una cuenta que ya existe. Como la persona
 * todavía no entró nunca, se borra la cuenta pendiente y se la invita de nuevo
 * con el mismo rol: el enlace anterior deja de servir.
 */
async function reenviar(admin: ClienteAdmin, cuerpo: Cuerpo) {
  const miembro = (await leerMiembros(admin)).find((m) => m.id === cuerpo.usuarioId);

  if (!miembro) {
    throw new Rechazo(404, "Esa cuenta ya no forma parte del equipo. Recarga la página.");
  }

  if (!miembro.invitacionPendiente) {
    throw new Rechazo(409, "Esta persona ya aceptó la invitación.");
  }

  const urlDeRetorno = leerUrlDeRetorno(cuerpo);
  const { error } = await admin.auth.admin.deleteUser(miembro.id);

  if (error) {
    throw error;
  }

  await enviarInvitacion(admin, { correo: miembro.correo, rol: miembro.rol, urlDeRetorno });
  return { correo: miembro.correo };
}

async function cambiarRol(admin: ClienteAdmin, actorId: string, cuerpo: Cuerpo) {
  const rol = leerRolDelPanel(cuerpo.rol);

  if (!rol) {
    throw new Rechazo(400, "Elige un rol: administrador u operador.");
  }

  const objetivoId = await validar(admin, actorId, cuerpo, { tipo: "cambiar_rol", rol });

  // Solo la clave `rol`: Auth fusiona `app_metadata`, así que el resto se conserva.
  const { error } = await admin.auth.admin.updateUserById(objetivoId, { app_metadata: { rol } });

  if (error) {
    throw error;
  }

  return { rol };
}

/**
 * Quitar el acceso borra la cuenta (no la suspende): caen sus sesiones y sus
 * tokens de renovación, el correo queda libre para una invitación futura y no se
 * guarda ningún dato de quien ya no trabaja aquí. Ninguna tabla referencia a las
 * cuentas del panel, así que no se pierde historial.
 */
async function quitar(admin: ClienteAdmin, actorId: string, cuerpo: Cuerpo) {
  const objetivoId = await validar(admin, actorId, cuerpo, { tipo: "quitar" });
  const { error } = await admin.auth.admin.deleteUser(objetivoId);

  if (error) {
    throw error;
  }

  return {};
}

/** Lee el equipo en este instante y aplica las reglas; devuelve el id del objetivo. */
async function validar(
  admin: ClienteAdmin,
  actorId: string,
  cuerpo: Cuerpo,
  cambio: Cambio,
): Promise<string> {
  const objetivoId = String(cuerpo.usuarioId ?? "");
  const miembros = await leerMiembros(admin);
  const motivo = validarCambio({ actorId, objetivoId, miembros, cambio });

  if (motivo) {
    throw new Rechazo(409, motivo);
  }

  return objetivoId;
}

function responder(estado: number, cuerpo: unknown): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { "Content-Type": "application/json" },
  });
}
