import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import {
  decidirAcciones,
  type Accion,
  type EstadoDeParada,
  type Umbrales,
} from "../_dominio/geocerca.ts";
import { suavizar, VENTANA_DE_SUAVIZADO, type Lectura } from "../_dominio/telemetria.ts";

/**
 * Pasos 2 a 5 del algoritmo: suavizar, detectar paradas cercanas, decidir y
 * escribir. El paso 1 (filtro de calidad) ocurre antes de guardar la posición,
 * en `index.ts`, porque decide si la lectura entra siquiera a la tabla como
 * usable.
 *
 * Las escrituras van con `service_role`: `eventos_geocerca` está reservada al
 * administrador por RLS, y con razón — un dispositivo que pudiera escribir sus
 * propios eventos podría declararse en una parada donde nunca estuvo, o borrar
 * la evidencia de que se la saltó.
 */

type FilaEstado = {
  parada_id: string;
  parada_nombre: string;
  notifica: boolean;
  dentro: boolean;
  entro_at: string | null;
  notificado_at: string | null;
  salio_at: string | null;
};

export type Resultado = {
  evaluada: boolean;
  notificadas: string[];
};

export async function evaluarGeocercas(
  admin: SupabaseClient,
  unidadId: string,
  viajeId: string,
  umbrales: Umbrales,
): Promise<Resultado> {
  const lecturas = await leerVentana(admin, viajeId);

  if (lecturas.length === 0) {
    return { evaluada: false, notificadas: [] };
  }

  const punto = suavizar(lecturas);

  const { data, error } = await admin.rpc("estado_de_geocercas", {
    viaje: viajeId,
    lat: punto.lat,
    lng: punto.lng,
  });

  if (error) {
    throw new Error(`estado_de_geocercas: ${error.message}`);
  }

  const filas = (data ?? []) as FilaEstado[];

  if (filas.length === 0) {
    // `estado_de_geocercas` solo mira viajes abiertos, así que no devuelve nada
    // cuando la app sube el respaldo de un recorrido ya cerrado. Ahí está la
    // garantía de que un lote viejo no notifique por una parada de un viaje que
    // terminó. Tampoco devuelve nada si la ruta no tiene paradas cargadas.
    //
    // En ambos casos la posición quedó guardada pero no se evaluó nada, y decir
    // `evaluada: true` le mentiría a la app sobre lo que pasó con su lote.
    return { evaluada: false, notificadas: [] };
  }

  // La permanencia se mide contra el reloj del servidor, no contra el del
  // teléfono: un equipo de gama baja que estuvo desenchufado arranca con la hora
  // corrida, y una hora corrida haría creer que la unidad lleva media hora en la
  // parada apenas llega.
  const acciones = decidirAcciones(filas.map(aEstado), new Date(), umbrales);

  await aplicar(admin, acciones, { unidadId, viajeId });

  return {
    evaluada: true,
    notificadas: nombresNotificados(acciones, filas),
  };
}

async function leerVentana(
  admin: SupabaseClient,
  viajeId: string,
): Promise<Lectura[]> {
  const { data, error } = await admin.rpc("posiciones_para_suavizar", {
    viaje: viajeId,
    limite: VENTANA_DE_SUAVIZADO,
  });

  if (error) {
    throw new Error(`posiciones_para_suavizar: ${error.message}`);
  }

  return (data ?? []).map((fila: Record<string, unknown>) => ({
    lat: Number(fila.lat),
    lng: Number(fila.lng),
    exactitudM: fila.exactitud_m === null ? null : Number(fila.exactitud_m),
    capturadoAt: String(fila.capturado_at),
  }));
}

function aEstado(fila: FilaEstado): EstadoDeParada {
  return {
    paradaId: fila.parada_id,
    notifica: fila.notifica,
    dentro: fila.dentro,
    entroAt: fila.entro_at,
    notificadoAt: fila.notificado_at,
    salioAt: fila.salio_at,
  };
}

type Contexto = { unidadId: string; viajeId: string };

/**
 * Las acciones se aplican en serie a propósito. Son pocas —como mucho una por
 * parada de la ruta— y sobre la misma fila pueden llegar dos (anular la salida y
 * notificar); en paralelo el orden dejaría de estar garantizado.
 */
async function aplicar(
  admin: SupabaseClient,
  acciones: Accion[],
  contexto: Contexto,
): Promise<void> {
  for (const accion of acciones) {
    const error = await aplicarUna(admin, accion, contexto);

    if (error) {
      // Se registra y se sigue: que falle una parada no debe impedir evaluar el
      // resto, y la posición ya quedó guardada.
      console.error(`[ecoruta] geocerca ${accion.tipo} ${accion.paradaId}:`, error);
    }
  }
}

async function aplicarUna(
  admin: SupabaseClient,
  accion: Accion,
  { unidadId, viajeId }: Contexto,
): Promise<unknown> {
  if (accion.tipo === "crear_evento") {
    // onConflict sobre (viaje_id, parada_id) hace idempotente el reintento: si
    // dos posiciones llegan casi juntas, la segunda no duplica ni revienta.
    const { error } = await admin.from("eventos_geocerca").upsert(
      {
        viaje_id: viajeId,
        unidad_id: unidadId,
        parada_id: accion.paradaId,
        entro_at: new Date().toISOString(),
      },
      { onConflict: "viaje_id,parada_id", ignoreDuplicates: true },
    );

    return error;
  }

  const { error } = await admin
    .from("eventos_geocerca")
    .update(cambioDe(accion.tipo))
    .eq("viaje_id", viajeId)
    .eq("parada_id", accion.paradaId);

  return error;
}

function cambioDe(tipo: Accion["tipo"]): Record<string, string | null> {
  const ahora = new Date().toISOString();

  if (tipo === "notificar") {
    return { notificado_at: ahora };
  }

  if (tipo === "registrar_salida") {
    return { salio_at: ahora };
  }

  // anular_salida: reentró antes de que venciera la histéresis, o sea que nunca
  // llegó a salir.
  return { salio_at: null };
}

function nombresNotificados(acciones: Accion[], filas: FilaEstado[]): string[] {
  const porId = new Map(filas.map((fila) => [fila.parada_id, fila.parada_nombre]));

  return acciones
    .filter((accion) => accion.tipo === "notificar")
    .map((accion) => porId.get(accion.paradaId) ?? accion.paradaId);
}
