import { clienteNavegador } from "@/lib/supabase/client";
import type { ParadaCercanaRow } from "@/types/database";
import { exito, falloRegistrado, type Resultado } from "./resultado";

type Coordenadas = {
  lat: number;
  lng: number;
};

type OpcionesBusqueda = Coordenadas & {
  radioMaximoM?: number;
  limite?: number;
};

/**
 * La cercanía la resuelve PostGIS en el servidor con el índice GiST, no el navegador:
 * traer todas las paradas para medirlas en el cliente no escala y desperdicia datos móviles.
 */
export async function buscarParadasCercanas({
  lat,
  lng,
  radioMaximoM = 1500,
  limite = 5,
}: OpcionesBusqueda): Promise<Resultado<ParadaCercanaRow[]>> {
  const { data, error } = await clienteNavegador().rpc("paradas_cercanas", {
    lat,
    lng,
    radio_max_m: radioMaximoM,
    limite,
  });

  if (error) {
    return falloRegistrado(
      "paradas_cercanas",
      error,
      "No se pudieron buscar las paradas cercanas.",
    );
  }

  return exito(data ?? []);
}

/** Media vuelta al mundo: ninguna parada queda fuera, la busque donde la busque. */
const RADIO_SIN_LIMITE_M = 20_000_000;

/**
 * La parada más cercana a cualquier distancia, para cuando no hay ninguna en el
 * radio normal: decirle al ciudadano «la más cercana está a 4 km» le sirve más
 * que un «no hay nada». Pide varias filas porque cada ruta de la parada es una.
 */
export function buscarParadaMasCercana(
  coordenadas: Coordenadas,
): Promise<Resultado<ParadaCercanaRow[]>> {
  return buscarParadasCercanas({
    ...coordenadas,
    radioMaximoM: RADIO_SIN_LIMITE_M,
  });
}
