import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Canje del código de vinculación del teléfono de una unidad.
 *
 * Por qué existe esta función y no lo hace la app directamente: el dispositivo necesita
 * una identidad en Supabase Auth cuyo `app_metadata.unidad_id` determine, vía RLS, de
 * qué unidad puede escribir posiciones. `app_metadata` solo se escribe desde el
 * servidor — si fuera `user_metadata`, el propio teléfono podría reasignarse a otra
 * unidad y escribir telemetría falsa en nombre ajeno.
 *
 * La alternativa sería meter la clave `service_role` dentro del APK. Eso saltaría RLS
 * por completo y se extrae de un APK en minutos: cualquiera podría leer y borrar toda
 * la base. Por eso la clave vive solo aquí, en el servidor.
 *
 * Se despliega con verify_jwt = false: el teléfono todavía no tiene sesión cuando llama.
 * Lo que autoriza no es un token, sino conocer un código válido, de un solo uso y
 * vigente por minutos.
 */

const CABECERAS_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Dominio no enrutable a propósito: el teléfono nunca recibe correo. La cuenta existe
 * solo para que Supabase Auth emita un token con el `unidad_id` dentro.
 */
const DOMINIO_DISPOSITIVOS = "dispositivos.ecoruta.test";

type Canje = {
  unidad_id: string;
  unidad_nombre: string;
  ruta_id: string | null;
  ruta_nombre: string | null;
  auth_user_id: string | null;
};

Deno.serve(async (peticion) => {
  if (peticion.method === "OPTIONS") {
    return new Response("ok", { headers: CABECERAS_CORS });
  }

  if (peticion.method !== "POST") {
    return responder(405, { error: "Método no permitido." });
  }

  const codigo = await leerCodigo(peticion);

  if (!codigo) {
    return responder(400, { error: "Escribe el código de vinculación." });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const { data, error } = await admin.rpc("canjear_codigo_de_vinculacion", { codigo });

  if (error) {
    console.error("[ecoruta] canjear_codigo_de_vinculacion:", error);
    return responder(500, { error: "No se pudo validar el código. Intenta de nuevo." });
  }

  const canje = (data as Canje[])[0];

  if (!canje) {
    // No se distingue «no existe» de «venció»: decirlo ayudaría a quien prueba códigos.
    return responder(401, { error: "El código no es válido o ya venció." });
  }

  const credenciales = await asegurarCuentaDelDispositivo(admin, canje);

  if (!credenciales) {
    return responder(500, { error: "No se pudo preparar el acceso del dispositivo." });
  }

  const sesion = await iniciarSesion(credenciales);

  if (!sesion) {
    return responder(500, { error: "No se pudo iniciar la sesión del dispositivo." });
  }

  return responder(200, {
    unidad: {
      id: canje.unidad_id,
      nombre: canje.unidad_nombre,
      // La ruta al momento de vincular. Si el admin reasigna la unidad, este
      // valor guardado en el teléfono queda viejo: ver el contrato.
      ruta_id: canje.ruta_id,
      ruta: canje.ruta_nombre,
    },
    sesion,
  });
});

async function leerCodigo(peticion: Request): Promise<string | null> {
  try {
    const cuerpo = await peticion.json();
    const codigo = String(cuerpo?.codigo ?? "").trim();

    return codigo.length > 0 ? codigo : null;
  } catch {
    return null;
  }
}

type Credenciales = { correo: string; contrasena: string };

/**
 * Crea la cuenta del dispositivo, o la reutiliza si el admin está revinculando el mismo
 * teléfono. La contraseña se regenera en cada vinculación: un código canjeado antes deja
 * de servir para obtener sesión.
 */
async function asegurarCuentaDelDispositivo(
  admin: ReturnType<typeof createClient>,
  canje: Canje,
): Promise<Credenciales | null> {
  const correo = `unidad-${canje.unidad_id}@${DOMINIO_DISPOSITIVOS}`;
  const contrasena = generarContrasena();

  const metadatos = {
    rol: "dispositivo",
    unidad_id: canje.unidad_id,
  };

  if (canje.auth_user_id) {
    const { error } = await admin.auth.admin.updateUserById(canje.auth_user_id, {
      password: contrasena,
      app_metadata: metadatos,
    });

    if (!error) {
      return { correo, contrasena };
    }

    // La cuenta registrada ya no existe (se borró a mano). Se cae a crearla de nuevo.
    console.error("[ecoruta] updateUserById:", error);
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: correo,
    password: contrasena,
    email_confirm: true,
    app_metadata: metadatos,
  });

  if (error || !data.user) {
    console.error("[ecoruta] createUser:", error);
    return null;
  }

  const { error: errorRegistro } = await admin.rpc("registrar_auth_de_dispositivo", {
    unidad: canje.unidad_id,
    usuario: data.user.id,
  });

  if (errorRegistro) {
    console.error("[ecoruta] registrar_auth_de_dispositivo:", errorRegistro);
  }

  return { correo, contrasena };
}

/**
 * La sesión se obtiene con la clave anónima, no con service_role: lo que viaja al
 * teléfono debe ser un token de dispositivo normal, sujeto a RLS como cualquier otro.
 */
async function iniciarSesion({ correo, contrasena }: Credenciales) {
  const cliente = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { auth: { persistSession: false } },
  );

  const { data, error } = await cliente.auth.signInWithPassword({
    email: correo,
    password: contrasena,
  });

  if (error || !data.session) {
    console.error("[ecoruta] signInWithPassword:", error);
    return null;
  }

  return {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
  };
}

function generarContrasena(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function responder(estado: number, cuerpo: unknown): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { ...CABECERAS_CORS, "Content-Type": "application/json" },
  });
}
