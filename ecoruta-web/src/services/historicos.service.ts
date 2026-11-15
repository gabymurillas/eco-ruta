import type { TipoDia, VelocidadDeFranja } from "@/domain/historicos";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { exito, fallo, falloRegistrado, type Resultado } from "./resultado";

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

export type ResumenDeRuta =
  Database["public"]["Functions"]["resumen_por_ruta"]["Returns"][number];

export async function obtenerResumenPorRuta(
  dias: number,
): Promise<Resultado<ResumenDeRuta[]>> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("resumen_por_ruta", { dias });

  if (error) {
    return falloRegistrado("resumen_por_ruta", error, "No se pudo calcular el resumen por ruta.");
  }

  return exito(data ?? []);
}

/**
 * La mediana de velocidad de cada ruta por hora y tipo de día, con todo el
 * historial (no depende del período de la pantalla).
 *
 * El nombre y el color se leen de `rutas` y no de `resumen_por_ruta`: una ruta
 * desactivada y sin viajes en el período no aparece allí, pero su historial sí.
 */
export async function obtenerVelocidadesPorFranja(): Promise<Resultado<VelocidadDeFranja[]>> {
  const supabase = await crearClienteServidor();
  const [velocidades, rutas] = await Promise.all([
    supabase.rpc("velocidades_por_franja"),
    supabase.from("rutas").select("id, nombre, color"),
  ]);

  if (velocidades.error || rutas.error) {
    return falloRegistrado(
      "velocidades_por_franja",
      velocidades.error ?? rutas.error,
      "No se pudo calcular la velocidad típica por hora.",
    );
  }

  const rutaPorId = new Map(rutas.data.map((ruta) => [ruta.id, ruta]));

  return exito(
    (velocidades.data ?? []).flatMap((fila) => {
      const ruta = rutaPorId.get(fila.ruta_id);
      if (!ruta) return [];

      return [{
        rutaId: fila.ruta_id,
        rutaNombre: ruta.nombre,
        rutaColor: ruta.color,
        // La base lo restringe con un check: solo puede ser uno de los dos.
        tipoDia: fila.tipo_dia as TipoDia,
        hora: fila.hora,
        medianaKmh: Number(fila.mediana_kmh),
        viajes: fila.viajes,
      }];
    }),
  );
}
