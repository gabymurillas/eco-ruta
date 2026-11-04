import { clienteNavegador } from "@/lib/supabase/client";

type Escucha = {
  /** Algo cambió en la flota: una posición, un viaje o una incidencia. */
  alCambiar: () => void;
  /** El canal quedó conectado (true) o se cayó (false). */
  alCambiarConexion: (conectado: boolean) => void;
};

/**
 * Avisa cada vez que la flota cambia. Devuelve la función que cierra el canal.
 *
 * No entrega los datos del cambio, solo la señal: quien escucha vuelve a pedir el
 * estado completo al servidor. Así la regla de salud de cada unidad vive en
 * `estado_flota` y no se repite aquí, y no hay que leer la geografía de
 * `posiciones`, que por el canal llega como WKB en hexadecimal.
 *
 * Las tres tablas se publican en sql/12_realtime_monitoreo.sql.
 */
export function escucharCambiosDeFlota({ alCambiar, alCambiarConexion }: Escucha): () => void {
  const cliente = clienteNavegador();

  const canal = cliente
    .channel("monitoreo-flota")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "posiciones" }, alCambiar)
    .on("postgres_changes", { event: "*", schema: "public", table: "viajes" }, alCambiar)
    .on("postgres_changes", { event: "*", schema: "public", table: "incidencias" }, alCambiar)
    .subscribe((estado, causa) => {
      alCambiarConexion(estado === "SUBSCRIBED");

      if (estado === "CHANNEL_ERROR" || estado === "TIMED_OUT") {
        console.error(`[ecoruta] realtime monitoreo ${estado}:`, causa);
      }
    });

  return () => {
    cliente.removeChannel(canal);
  };
}
