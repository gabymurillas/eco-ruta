import { clienteNavegador } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import { exito, falloRegistrado, type Resultado } from "./resultado";

type FilaLlegada =
  Database["public"]["Functions"]["llegadas_a_parada"]["Returns"][number];

/**
 * El generador declara obligatorias todas las columnas de una función. Estas llegan
 * nulas sin posición, sin trazado o con la parada ya atrás, y una lectura sin
 * velocidad es null dentro del arreglo: se corrigen para que el compilador obligue
 * a tratarlo.
 */
export type LlegadaRow = Omit<FilaLlegada, "distancia_trazado_m" | "velocidades_kmh"> & {
  distancia_trazado_m: number | null;
  velocidades_kmh: (number | null)[] | null;
};

/**
 * Qué unidades vienen hacia una parada.
 *
 * Usa el cliente público: el ciudadano no se autentica y RLS ya limita lo que puede
 * leer. La función devuelve la antigüedad de la última señal, no un estado ya
 * interpretado, porque el umbral es calibrable.
 */
export async function obtenerLlegadas(
  paradaId: string,
): Promise<Resultado<LlegadaRow[]>> {
  const { data, error } = await clienteNavegador().rpc("llegadas_a_parada", {
    parada: paradaId,
  });

  if (error) {
    return falloRegistrado(
      "llegadas_a_parada",
      error,
      "No se pudieron cargar las llegadas a esta parada.",
    );
  }

  return exito(data ?? []);
}
