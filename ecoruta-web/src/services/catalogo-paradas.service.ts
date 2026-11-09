import { crearClienteServidor } from "@/lib/supabase/server";
import { exito, fallo, type Resultado } from "./resultado";

/**
 * Las paradas de la ciudad, para el admin. Usa el cliente de servidor: lo llaman
 * páginas y Server Actions, nunca el navegador (ver `paradas.service.ts`).
 *
 * Una parada no pertenece a una ruta. Qué rutas pasan por ella lo calcula la
 * base desde el trazado (vista `paradas_por_ruta`), así que aquí no se asigna.
 */

export type RutaQuePasa = {
  id: string;
  nombre: string;
  color: string;
};

export type ParadaDeLaCiudad = {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  radioM: number;
  /** Con `false` la parada registra el paso de las unidades, pero no avisa al ciudadano. */
  notifica: boolean;
  rutas: RutaQuePasa[];
};

export async function obtenerParadasDeLaCiudad(): Promise<Resultado<ParadaDeLaCiudad[]>> {
  const supabase = await crearClienteServidor();
  // `paradas_de_la_ciudad` no devuelve `notifica`; se lee aparte para no exigir
  // una migración solo por una columna que ya está en la tabla.
  const [{ data, error }, avisos] = await Promise.all([
    supabase.rpc("paradas_de_la_ciudad"),
    supabase.from("paradas").select("id, notifica"),
  ]);

  if (error || avisos.error) {
    return fallo("No se pudieron cargar las paradas.");
  }

  const notificaDe = new Map(avisos.data.map((fila) => [fila.id, fila.notifica]));

  return exito(
    (data ?? []).map((fila) => ({
      id: fila.parada_id,
      nombre: fila.parada_nombre,
      lat: fila.parada_lat,
      lng: fila.parada_lng,
      radioM: fila.radio_geocerca_m,
      notifica: notificaDe.get(fila.parada_id) ?? true,
      // jsonb llega sin tipo: la forma la fija `paradas_de_la_ciudad`.
      rutas: fila.rutas as RutaQuePasa[],
    })),
  );
}

type DatosDeParada = {
  nombre: string;
  lat: number;
  lng: number;
  radioM: number;
  notifica: boolean;
};

export async function crearParada({
  nombre,
  lat,
  lng,
  radioM,
  notifica,
}: DatosDeParada): Promise<Resultado<string>> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("crear_parada", {
    nombre_parada: nombre,
    lat,
    lng,
    radio_m: radioM,
  });

  if (error) {
    return fallo("No se pudo crear la parada.");
  }

  // `crear_parada` la deja avisando (el valor por defecto de la columna). Solo
  // hace falta una segunda escritura si el admin la creó sin avisos.
  if (!notifica) {
    const sinAvisos = await supabase.from("paradas").update({ notifica }).eq("id", data);
    if (sinAvisos.error) {
      return fallo("La parada se creó, pero sigue avisando. Ábrela y vuelve a apagar los avisos.");
    }
  }

  return exito(data);
}

/**
 * Posición, radio, nombre y avisos en una sola llamada del admin. Son dos escrituras; si
 * la segunda falla, la primera ya quedó y reintentar con los mismos datos no
 * hace daño.
 */
export async function actualizarParada(
  paradaId: string,
  { nombre, lat, lng, radioM, notifica }: DatosDeParada,
): Promise<Resultado<null>> {
  const supabase = await crearClienteServidor();

  const movida = await supabase.rpc("mover_parada", {
    parada: paradaId,
    lat,
    lng,
    radio_m: radioM,
  });

  if (movida.error) {
    return fallo("No se pudo mover la parada.");
  }

  const renombrada = await supabase.from("paradas").update({ nombre, notifica }).eq("id", paradaId);

  if (renombrada.error) {
    return fallo("No se pudo guardar el nombre ni los avisos de la parada.");
  }

  return exito(null);
}

export async function eliminarParada(paradaId: string): Promise<Resultado<null>> {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("paradas").delete().eq("id", paradaId);

  if (error) {
    return fallo("No se pudo eliminar la parada.");
  }

  return exito(null);
}
