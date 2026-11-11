import { crearClienteServidor } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { exito, falloRegistrado, type Resultado } from "./resultado";

export type RutaDeMapa =
  Database["public"]["Functions"]["rutas_para_mapa"]["Returns"][number];

/**
 * Geometría de las rutas activas para dibujar el mapa.
 *
 * Esta es la del admin, desde un Server Component (con sesión en cookies). La del
 * ciudadano, desde el navegador, vive en `mapa-publico.service.ts`: un componente
 * cliente no puede importar este archivo, que arrastra `next/headers`.
 */
export async function obtenerRutasDeMapa(): Promise<Resultado<RutaDeMapa[]>> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("rutas_para_mapa");

  if (error) {
    return falloRegistrado(
      "rutas_para_mapa (servidor)",
      error,
      "No se pudo cargar el trazado de las rutas.",
    );
  }

  return exito(data ?? []);
}
