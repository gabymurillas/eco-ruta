"use client";

import { useState } from "react";
import type { Punto } from "@/domain/mapa";
import type { Caminata } from "@/services/caminata.service";
import { pedirCaminata } from "../acciones-caminata";

export type EstadoCaminata =
  | { tipo: "oculta" }
  | { tipo: "cargando" }
  | { tipo: "lista"; caminata: Caminata }
  | { tipo: "error"; mensaje: string };

/**
 * El camino a pie hasta la parada. Se pide solo cuando el ciudadano toca
 * «Cómo llegar» (cada pedido gasta cuota del servicio) y se olvida al cambiar
 * de parada.
 */
export function useCaminata(paradaId: string | null) {
  const [guardado, setGuardado] = useState<{ paradaId: string | null; estado: EstadoCaminata }>({
    paradaId,
    estado: { tipo: "oculta" },
  });
  const estado: EstadoCaminata =
    guardado.paradaId === paradaId ? guardado.estado : { tipo: "oculta" };

  /** Devuelve si hay camino, para que quien llama mueva el mapa hacia él. */
  const pedir = async (desde: Punto, hasta: Punto): Promise<boolean> => {
    setGuardado({ paradaId, estado: { tipo: "cargando" } });
    const resultado = await pedirCaminata(desde, hasta);

    setGuardado({
      paradaId,
      estado: resultado.ok
        ? { tipo: "lista", caminata: resultado.caminata }
        : { tipo: "error", mensaje: resultado.error },
    });

    return resultado.ok;
  };

  return {
    estado,
    pedir,
    ocultar: () => setGuardado({ paradaId, estado: { tipo: "oculta" } }),
  };
}
