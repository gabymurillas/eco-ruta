import type { Aviso } from "@/domain/avisos";
import { clienteNavegador } from "@/lib/supabase/client";
import type { AvisoParada } from "@/types/database";
import { exito, falloRegistrado, type Resultado } from "./resultado";

/**
 * Los avisos de la parada que ya existían cuando el ciudadano abrió la página.
 * Sin esto, quien llega con el bus a 300 m no vería nada: el aviso por
 * Realtime salió antes de que se suscribiera.
 */
export async function obtenerAvisosDesde(
  paradaId: string,
  desde: Date,
): Promise<Resultado<Aviso[]>> {
  const { data, error } = await clienteNavegador()
    .from("avisos_parada")
    .select("*")
    .eq("parada_id", paradaId)
    .gte("creado_at", desde.toISOString());

  if (error) {
    return falloRegistrado(
      "avisos_parada",
      error,
      "No se pudieron cargar los avisos de tu parada.",
    );
  }

  return exito(data.map(aAviso));
}

/**
 * Avisa de cada aviso nuevo de esta parada. Devuelve la función que cierra el
 * canal.
 *
 * Solo INSERT: el servidor nunca actualiza un aviso, escribe uno nuevo. Si el
 * canal falla no se muestra error: la lista de llegadas sigue refrescándose y
 * basta para saber qué viene. Se registra para poder diagnosticarlo.
 */
export function escucharAvisos(
  paradaId: string,
  alRecibir: (aviso: Aviso) => void,
): () => void {
  const cliente = clienteNavegador();

  const canal = cliente
    .channel(`avisos-parada-${paradaId}`)
    .on<AvisoParada>(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "avisos_parada",
        filter: `parada_id=eq.${paradaId}`,
      },
      (cambio) => alRecibir(aAviso(cambio.new as AvisoParada)),
    )
    .subscribe((estado, causa) => {
      if (estado === "CHANNEL_ERROR" || estado === "TIMED_OUT") {
        console.error(`[ecoruta] realtime avisos ${estado}:`, causa);
      }
    });

  return () => {
    cliente.removeChannel(canal);
  };
}

function aAviso(fila: AvisoParada): Aviso {
  return {
    id: fila.id,
    viajeId: fila.viaje_id,
    unidadId: fila.unidad_id,
    // El check de la tabla garantiza que solo llegan estos dos valores.
    tipo: fila.tipo as Aviso["tipo"],
    creadoAt: fila.creado_at,
  };
}
