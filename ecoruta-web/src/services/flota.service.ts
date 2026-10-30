import { crearClienteServidor } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { exito, falloRegistrado, type Resultado } from "./resultado";

export type EstadoUnidad =
  Database["public"]["Functions"]["estado_flota"]["Returns"][number];

export async function obtenerEstadoDeFlota(): Promise<Resultado<EstadoUnidad[]>> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("estado_flota");

  if (error) {
    return falloRegistrado(
      "estado_flota",
      error,
      "No se pudo cargar el estado de la flota.",
    );
  }

  return exito(data ?? []);
}
