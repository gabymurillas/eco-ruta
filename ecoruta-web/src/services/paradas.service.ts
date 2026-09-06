import { supabase } from "@/lib/supabase";
import type { ParadaCercanaRow } from "@/types/database";
import { exito, fallo, type Resultado } from "./resultado";

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
  const { data, error } = await supabase.rpc("paradas_cercanas", {
    lat,
    lng,
    radio_max_m: radioMaximoM,
    limite,
  });

  if (error) {
    return fallo("No se pudieron buscar las paradas cercanas.");
  }

  return exito(data ?? []);
}
