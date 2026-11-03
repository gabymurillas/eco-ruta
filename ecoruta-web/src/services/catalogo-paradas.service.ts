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
  rutas: RutaQuePasa[];
};

export async function obtenerParadasDeLaCiudad(): Promise<Resultado<ParadaDeLaCiudad[]>> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("paradas_de_la_ciudad");

  if (error) {
    return fallo("No se pudieron cargar las paradas.");
  }

  return exito(
    (data ?? []).map((fila) => ({
      id: fila.parada_id,
      nombre: fila.parada_nombre,
      lat: fila.parada_lat,
      lng: fila.parada_lng,
      radioM: fila.radio_geocerca_m,
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
};

export async function crearParada({
  nombre,
  lat,
  lng,
  radioM,
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

  return exito(data);
}

/**
 * Posición, radio y nombre en una sola llamada del admin. Son dos escrituras; si
 * la segunda falla, la primera ya quedó y reintentar con los mismos datos no
 * hace daño.
 */
export async function actualizarParada(
  paradaId: string,
  { nombre, lat, lng, radioM }: DatosDeParada,
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

  const renombrada = await supabase.from("paradas").update({ nombre }).eq("id", paradaId);

  if (renombrada.error) {
    return fallo("No se pudo renombrar la parada.");
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
