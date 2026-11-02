import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import type { Aviso, TipoAviso } from "../_dominio/avisos.ts";

/**
 * Escribe en `avisos_parada` lo que decidió `_dominio/avisos.ts`. La web del
 * ciudadano escucha los INSERT de esa tabla por Realtime: escribir el aviso es
 * enviarlo.
 */

export type AvisoEmitido = { tipo: TipoAviso; parada: string };

type Contexto = {
  unidadId: string;
  viajeId: string;
  filas: { parada_id: string; parada_nombre: string }[];
};

/**
 * `ignoreDuplicates` sobre (viaje_id, parada_id, tipo) hace idempotente el
 * reintento, y además no emite nada por Realtime: un insert que choca con el
 * unique no ocurre, así que el ciudadano no recibe el mismo aviso dos veces.
 *
 * Como en `aplicar`, un fallo se registra y no detiene el resto: la posición ya
 * quedó guardada y la siguiente lectura vuelve a decidir el aviso pendiente.
 */
export async function aplicarAvisos(
  admin: SupabaseClient,
  avisos: Aviso[],
  { unidadId, viajeId, filas }: Contexto,
): Promise<AvisoEmitido[]> {
  const nombres = new Map(filas.map((fila) => [fila.parada_id, fila.parada_nombre]));
  const emitidos: AvisoEmitido[] = [];

  for (const aviso of avisos) {
    const { error } = await admin.from("avisos_parada").upsert(
      {
        viaje_id: viajeId,
        unidad_id: unidadId,
        parada_id: aviso.paradaId,
        tipo: aviso.tipo,
      },
      { onConflict: "viaje_id,parada_id,tipo", ignoreDuplicates: true },
    );

    if (error) {
      console.error(`[ecoruta] aviso ${aviso.tipo} ${aviso.paradaId}:`, error);
      continue;
    }

    emitidos.push({ tipo: aviso.tipo, parada: nombres.get(aviso.paradaId) ?? aviso.paradaId });
  }

  return emitidos;
}
