import { createClient } from "jsr:@supabase/supabase-js@2";
import { esUsable } from "../_dominio/telemetria.ts";
import { evaluarGeocercas, type UmbralesDeEvaluacion } from "./evaluacion.ts";

/**
 * Recibe telemetría del dispositivo, la guarda y evalúa las geocercas.
 *
 * Por qué la app no inserta directo en `posiciones` y ya: nada dispararía la
 * evaluación. Las alternativas eran un webhook con pg_net —asíncrono y sin
 * reintento: si la evaluación falla, nadie se entera, y el producto de este
 * sistema son justamente las notificaciones— o un trigger en PL/pgSQL, que
 * llevaría la lógica crítica a SQL. Aquí es síncrono: el fallo le llega a la app
 * y esta puede reintentar desde su buffer offline.
 *
 * El insert va con el token del propio dispositivo, no con service_role, para
 * que RLS siga siendo quien garantiza que solo escriba su unidad. La evaluación
 * sí usa service_role, porque `eventos_geocerca` está reservada al administrador.
 */

const CABECERAS_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type LecturaEntrante = {
  lat: number;
  lng: number;
  exactitud_m?: number | null;
  velocidad_kmh?: number | null;
  capturado_at: string;
};

type Peticion = {
  viaje_id?: string | null;
  posiciones?: LecturaEntrante[];
};

Deno.serve(async (peticion) => {
  if (peticion.method === "OPTIONS") {
    return new Response("ok", { headers: CABECERAS_CORS });
  }

  if (peticion.method !== "POST") {
    return responder(405, { error: "Método no permitido." });
  }

  const autorizacion = peticion.headers.get("Authorization");

  if (!autorizacion) {
    return responder(401, { error: "Falta la sesión del dispositivo." });
  }

  let cuerpo: Peticion;

  try {
    cuerpo = await peticion.json();
  } catch {
    return responder(400, { error: "El cuerpo no es JSON válido." });
  }

  const lecturas = (cuerpo.posiciones ?? []).filter(esLecturaValida);

  if (lecturas.length === 0) {
    return responder(400, { error: "No llegó ninguna posición válida." });
  }

  const comoDispositivo = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      auth: { persistSession: false },
      global: { headers: { Authorization: autorizacion } },
    },
  );

  const unidadId = await unidadDelToken(comoDispositivo);

  if (!unidadId) {
    return responder(401, { error: "La sesión no corresponde a un dispositivo." });
  }

  try {
    return await procesar({ comoDispositivo, unidadId, lecturas, viajeId: cuerpo.viaje_id });
  } catch (causa) {
    console.error("[ecoruta] registrar-posicion:", causa);
    return responder(500, { error: "No se pudo registrar la posición." });
  }
});

type Trabajo = {
  comoDispositivo: ReturnType<typeof createClient>;
  unidadId: string;
  lecturas: LecturaEntrante[];
  viajeId?: string | null;
};

async function procesar(
  { comoDispositivo, unidadId, lecturas, viajeId }: Trabajo,
): Promise<Response> {
  const umbrales = await leerUmbrales(comoDispositivo);
  const ordenadas = [...lecturas].sort(porCapturaAscendente);

  // Paso 1 del algoritmo: una lectura de mala exactitud se guarda igual —sirve
  // para el histórico y para diagnosticar el GPS— pero marcada `usable = false`,
  // y no participa ni del suavizado ni de las geocercas.
  const filas = ordenadas.map((lectura) => ({
    unidad_id: unidadId,
    viaje_id: viajeId ?? null,
    ubicacion: `SRID=4326;POINT(${lectura.lng} ${lectura.lat})`,
    velocidad_kmh: lectura.velocidad_kmh ?? null,
    exactitud_m: lectura.exactitud_m ?? null,
    usable: esUsable(lectura.exactitud_m ?? null, umbrales.exactitudMaximaM),
    capturado_at: lectura.capturado_at,
  }));

  const { error } = await comoDispositivo.from("posiciones").insert(filas);

  if (error) {
    // 42501 es el rechazo de RLS: el token intentó escribir otra unidad.
    const codigo = (error as { code?: string }).code === "42501" ? 403 : 500;

    console.error("[ecoruta] insert posiciones:", error);
    return responder(codigo, { error: "No se pudo guardar la posición." });
  }

  const evaluacion = await evaluarSiCorresponde({ unidadId, viajeId, filas, umbrales });

  return responder(200, { guardadas: filas.length, ...evaluacion });
}

type Fila = { usable: boolean };

/**
 * Solo se evalúa contra la posición más reciente, aunque el lote traiga un
 * buffer offline entero. Notificar por una parada que la unidad dejó atrás hace
 * veinte minutos, cuando el teléfono recupera señal y descarga la cola, sería
 * peor que no notificar: el ciudadano saldría a esperar un vehículo que ya pasó.
 */
async function evaluarSiCorresponde(
  { unidadId, viajeId, filas, umbrales }: {
    unidadId: string;
    viajeId?: string | null;
    filas: Fila[];
    umbrales: Umbrales;
  },
) {
  const ultimaEsUsable = filas[filas.length - 1].usable;

  if (!viajeId || !ultimaEsUsable) {
    return { evaluada: false, notificadas: [] as string[], avisos: [] };
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  return await evaluarGeocercas(admin, unidadId, viajeId, umbrales);
}

type Umbrales = UmbralesDeEvaluacion & { exactitudMaximaM: number };

/**
 * Los umbrales salen de la tabla `parametros`, nunca de constantes: son los
 * mismos que se recalibran tras la prueba de campo de GPS, y quemarlos aquí
 * obligaría a desplegar para cambiar un número.
 */
async function leerUmbrales(
  cliente: ReturnType<typeof createClient>,
): Promise<Umbrales> {
  const { data, error } = await cliente.from("parametros").select("clave, valor");

  if (error) {
    throw new Error(`parametros: ${error.message}`);
  }

  const valores = new Map(
    (data ?? []).map((fila) => [String(fila.clave), Number(fila.valor)]),
  );

  return {
    exactitudMaximaM: valores.get("exactitud_maxima_m") ?? 50,
    permanenciaMinimaS: valores.get("permanencia_minima_s") ?? 45,
    histeresisSalidaS: valores.get("histeresis_salida_s") ?? 30,
    radioAproximacionM: valores.get("radio_aproximacion_m") ?? 500,
  };
}

async function unidadDelToken(
  cliente: ReturnType<typeof createClient>,
): Promise<string | null> {
  const { data, error } = await cliente.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  const unidad = data.user.app_metadata?.unidad_id;

  return typeof unidad === "string" ? unidad : null;
}

function esLecturaValida(lectura: LecturaEntrante): boolean {
  return (
    Number.isFinite(lectura?.lat) &&
    Number.isFinite(lectura?.lng) &&
    Math.abs(lectura.lat) <= 90 &&
    Math.abs(lectura.lng) <= 180 &&
    typeof lectura.capturado_at === "string" &&
    !Number.isNaN(Date.parse(lectura.capturado_at))
  );
}

/** Un lote descargado del buffer puede llegar desordenado; el suavizado no. */
function porCapturaAscendente(a: LecturaEntrante, b: LecturaEntrante): number {
  return Date.parse(a.capturado_at) - Date.parse(b.capturado_at);
}

function responder(estado: number, cuerpo: unknown): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { ...CABECERAS_CORS, "Content-Type": "application/json" },
  });
}
