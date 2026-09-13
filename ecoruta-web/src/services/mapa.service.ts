import { clienteNavegador } from "@/lib/supabase/client";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { exito, fallo, type Resultado } from "./resultado";

export type RutaDeMapa =
  Database["public"]["Functions"]["rutas_para_mapa"]["Returns"][number];

/**
 * Geometría de las rutas activas para dibujar el mapa.
 *
 * Hay dos variantes porque las llaman dos superficies distintas: el admin desde un
 * Server Component (con sesión en cookies) y el ciudadano desde el navegador (sin
 * autenticarse). La consulta es la misma; cambia solo de qué cliente sale.
 */
export async function obtenerRutasDeMapa(): Promise<Resultado<RutaDeMapa[]>> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("rutas_para_mapa");

  if (error) {
    return fallo("No se pudo cargar el trazado de las rutas.");
  }

  return exito(data ?? []);
}

export async function obtenerRutasDeMapaPublicas(): Promise<Resultado<RutaDeMapa[]>> {
  const { data, error } = await clienteNavegador().rpc("rutas_para_mapa");

  if (error) {
    return fallo("No se pudo cargar el trazado de las rutas.");
  }

  return exito(data ?? []);
}
