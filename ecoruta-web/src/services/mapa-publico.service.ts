import { clienteNavegador } from "@/lib/supabase/client";
import type { RutaDeMapa } from "./mapa.service";
import { exito, falloRegistrado, type Resultado } from "./resultado";

/**
 * Geometría de las rutas activas para el mapa del ciudadano, desde el navegador y
 * sin sesión. Es la misma consulta que usa el admin (`obtenerRutasDeMapa`); va en
 * archivo aparte porque aquel importa el cliente de servidor (`next/headers`).
 * El trazado es público: ver la política de exposición.
 */
export async function obtenerRutasDeMapaPublicas(): Promise<Resultado<RutaDeMapa[]>> {
  const { data, error } = await clienteNavegador().rpc("rutas_para_mapa");

  if (error) {
    return falloRegistrado(
      "rutas_para_mapa (navegador)",
      error,
      "No se pudo cargar el trazado de las rutas.",
    );
  }

  return exito(data ?? []);
}
