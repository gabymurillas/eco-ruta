import { crearClienteServidor } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { exito, fallo, type Resultado } from "./resultado";

export type EstadoUnidad =
  Database["public"]["Functions"]["estado_flota"]["Returns"][number];

export async function obtenerEstadoDeFlota(): Promise<Resultado<EstadoUnidad[]>> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("estado_flota");

  if (error) {
    return fallo("No se pudo cargar el estado de la flota.");
  }

  return exito(data ?? []);
}

export async function contarIncidenciasActivas(): Promise<Resultado<number>> {
  const supabase = await crearClienteServidor();

  const { count, error } = await supabase
    .from("incidencias")
    .select("*", { count: "exact", head: true })
    .eq("activa", true);

  if (error) {
    return fallo("No se pudieron contar las incidencias.");
  }

  return exito(count ?? 0);
}
