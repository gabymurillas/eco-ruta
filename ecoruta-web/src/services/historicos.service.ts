import { crearClienteServidor } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { exito, fallo, type Resultado } from "./resultado";

export type ResumenHistoricos =
  Database["public"]["Functions"]["resumen_historicos"]["Returns"][number];

export type ViajesPorDia =
  Database["public"]["Functions"]["viajes_por_dia"]["Returns"][number];

export async function obtenerResumen(
  dias: number,
): Promise<Resultado<ResumenHistoricos>> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("resumen_historicos", { dias });

  if (error || !data?.[0]) {
    return fallo("No se pudo calcular el resumen del período.");
  }

  return exito(data[0]);
}

export async function obtenerViajesPorDia(
  dias: number,
): Promise<Resultado<ViajesPorDia[]>> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("viajes_por_dia", { dias });

  if (error) {
    return fallo("No se pudieron cargar los viajes por día.");
  }

  return exito(data ?? []);
}
