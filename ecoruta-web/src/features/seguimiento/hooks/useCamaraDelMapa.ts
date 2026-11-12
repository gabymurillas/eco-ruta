"use client";

import { useState } from "react";
import type { LlegadaRow } from "@/services/llegadas.service";
import type { Camara } from "../components/CamaraDelCiudadano";
import { evaluarLlegadas, type AjustesDeLlegada } from "../llegadas-ordenadas";
import type { RutaSeguida } from "../seguir-ruta";

type Estado = {
  /** La parada para la que vale este estado: al cambiar de parada se empieza de cero. */
  paradaId: string | null;
  camara: Camara;
  seguida: RutaSeguida | null;
};

const INICIAL: Omit<Estado, "paradaId"> = { camara: { modo: "auto", vez: 0 }, seguida: null };

/**
 * Qué mira el mapa del ciudadano: la ruta que tocó, si sigue a una unidad o a sí
 * mismo, o si movió el mapa con el dedo y hay que dejarlo quieto.
 */
export function useCamaraDelMapa(
  paradaId: string | null,
  llegadas: readonly LlegadaRow[],
  ajustes: AjustesDeLlegada,
) {
  const [estado, setEstado] = useState<Estado>({ paradaId, ...INICIAL });
  const vigente = estado.paradaId === paradaId ? estado : { paradaId, ...INICIAL };
  const { camara, seguida } = vigente;

  const cambiar = (cambio: Partial<Omit<Estado, "paradaId">>, nuevoToque = false) =>
    setEstado({
      ...vigente,
      ...cambio,
      camara: {
        ...(cambio.camara ?? vigente.camara),
        vez: vigente.camara.vez + (nuevoToque ? 1 : 0),
      },
    });

  return {
    camara,
    seguida,
    seguir: (rutaId: string, unidadId?: string) =>
      cambiar(
        {
          seguida: { rutaId, unidadId: unidadId ?? unidadMasProxima(llegadas, rutaId, ajustes) },
          camara: { modo: "ruta", vez: 0 },
        },
        true,
      ),
    dejarDeSeguir: () => cambiar({ seguida: null, camara: { modo: "libre", vez: 0 } }),
    volverALaRuta: () => cambiar({ camara: { modo: "ruta", vez: 0 } }, true),
    verCaminata: () => cambiar({ camara: { modo: "caminata", vez: 0 } }, true),
    irAMiUbicacion: () => cambiar({ camara: { modo: "ubicacion", vez: 0 } }, true),
    alMoverAMano: () => {
      if (camara.modo !== "libre") {
        cambiar({ camara: { modo: "libre", vez: 0 } });
      }
    },
  };
}

/** La unidad de esa ruta que llega antes, en el mismo orden que la lista. */
function unidadMasProxima(
  llegadas: readonly LlegadaRow[],
  rutaId: string,
  ajustes: AjustesDeLlegada,
): string | null {
  const primera = evaluarLlegadas(llegadas, ajustes).find(
    ({ fila }) => fila.ruta_id === rutaId && fila.unidad_lat !== null && fila.unidad_lng !== null,
  );

  return primera?.fila.unidad_id ?? null;
}
