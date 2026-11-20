import type { FilaDeRecorrido } from "@/domain/recorrido";
import { clienteNavegador } from "@/lib/supabase/client";
import { exito, falloRegistrado, type Resultado } from "./resultado";

/**
 * Las paradas de una ruta en orden, con las unidades que vienen a cada una.
 *
 * Usa el cliente público: el ciudadano no se autentica y la función solo entrega
 * lo que `llegadas_a_parada` ya muestra (sql/20). El generador declara obligatorias
 * todas las columnas de una función; las de la unidad llegan nulas en una parada
 * sin unidades, y aquí se tratan como tales.
 */
export async function obtenerRecorrido(rutaId: string): Promise<Resultado<FilaDeRecorrido[]>> {
  const { data, error } = await clienteNavegador().rpc("llegadas_de_ruta", { ruta: rutaId });

  if (error) {
    return falloRegistrado("llegadas_de_ruta", error, "No se pudo cargar el recorrido de esta ruta.");
  }

  return exito(
    (data ?? []).map((fila) => ({
      paradaId: fila.parada_id,
      paradaNombre: fila.parada_nombre,
      paradaLat: fila.parada_lat,
      paradaLng: fila.parada_lng,
      unidadId: fila.unidad_id ?? null,
      unidadNombre: fila.unidad_nombre ?? null,
      unidadLat: fila.unidad_lat ?? null,
      unidadLng: fila.unidad_lng ?? null,
      viajeId: fila.viaje_id ?? null,
      segundosSinSenal: fila.segundos_sin_senal ?? null,
      distanciaTrazadoM: fila.distancia_trazado_m ?? null,
      yaPaso: fila.ya_paso ?? false,
      velocidadesKmh: fila.velocidades_kmh ?? [],
      incidenciaActiva: fila.incidencia_activa ?? false,
      velocidadHistoricaKmh: fila.velocidad_historica_kmh ?? null,
      letrero: fila.letrero ?? null,
    })),
  );
}
