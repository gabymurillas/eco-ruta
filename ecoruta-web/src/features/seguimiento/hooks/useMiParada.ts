"use client";

import { useCallback, useEffect, useState } from "react";
import { guardarMiParada, leerMiParada } from "@/services/preferencias.service";
import type { Resultado } from "@/services/resultado";
import { ubicacionYaPermitida } from "@/services/ubicacion.service";
import {
  sinDistancia,
  type ParadaConRutas,
  type ParadaElegida,
  type ParadaGuardada,
} from "../types";
import { useCercanas, type EstadoDePedido } from "./useCercanas";

/** Qué muestra la pantalla. Una sola fuente, para que dos estados no compitan. */
export type Fase =
  | { tipo: "cargando" }
  | { tipo: "bienvenida" }
  | { tipo: "buscando" }
  | { tipo: "sin_ubicacion"; motivo: "negada" | "fallida" | "no_disponible" }
  | { tipo: "error"; mensaje: string }
  | { tipo: "sin_paradas"; masCercana: ParadaConRutas | null }
  | { tipo: "selector"; paradas: ParadaConRutas[] }
  | { tipo: "parada"; parada: ParadaElegida };

/**
 * «Mi parada»: cuál sigue el ciudadano, sin cuenta y sin servidor.
 *
 * La ubicación se pide solo cuando el ciudadano toca el botón: un navegador que
 * pregunta sin contexto se lleva un «no» casi siempre. Quien vuelve con su
 * parada guardada la ve de inmediato; si ya había dado permiso, la ubicación se
 * lee en silencio para mostrarle cuánto le toma caminar.
 */
export function useMiParada() {
  const { ubicacion, cercanas, masCercana, pedirUbicacion } = useCercanas();
  const [iniciado, setIniciado] = useState(false);
  const [guardada, setGuardada] = useState<ParadaGuardada | null>(null);
  const [cambiando, setCambiando] = useState(false);

  useEffect(() => {
    // localStorage y los permisos solo existen en el navegador: leerlos durante
    // el render rompería la hidratación del HTML que manda el servidor.
    ubicacionYaPermitida().then((permitida) => {
      setGuardada(leerMiParada());
      setIniciado(true);

      if (permitida) {
        void pedirUbicacion();
      }
    });
  }, [pedirUbicacion]);

  const elegir = useCallback((parada: ParadaConRutas) => {
    guardarMiParada(sinDistancia(parada));
    setGuardada(sinDistancia(parada));
    setCambiando(false);
  }, []);

  const abrirSelector = useCallback(() => {
    setCambiando(true);

    if (!cercanas) {
      void pedirUbicacion();
    }
  }, [cercanas, pedirUbicacion]);

  const paradas = cercanas?.ok ? cercanas.datos : [];
  // Primera visita: sin parada guardada, la más cercana queda elegida.
  const elegida = conDistancia(guardada ?? paradas[0] ?? null, paradas);

  return {
    fase: derivarFase({
      iniciado,
      ubicacion,
      cercanas,
      masCercana,
      elegida,
      cambiando,
    }),
    ubicacion,
    cercanas,
    elegida,
    pedirUbicacion,
    elegir,
    abrirSelector,
    cerrarSelector: useCallback(() => setCambiando(false), []),
  };
}

/** La distancia sale de la búsqueda, si la parada quedó entre las cercanas. */
function conDistancia(
  parada: ParadaGuardada | null,
  cercanas: readonly ParadaConRutas[],
): ParadaElegida | null {
  if (!parada) {
    return null;
  }

  const encontrada = cercanas.find(
    (cercana) => cercana.paradaId === parada.paradaId,
  );
  return { ...parada, distanciaM: encontrada?.distanciaM ?? null };
}

type Estado = {
  iniciado: boolean;
  ubicacion: EstadoDePedido;
  cercanas: Resultado<ParadaConRutas[]> | null;
  masCercana: ParadaConRutas | null;
  elegida: ParadaElegida | null;
  cambiando: boolean;
};

function derivarFase({
  iniciado,
  ubicacion,
  cercanas,
  masCercana,
  elegida,
  cambiando,
}: Estado): Fase {
  if (!iniciado) {
    return { tipo: "cargando" };
  }

  if (elegida && !cambiando) {
    return { tipo: "parada", parada: elegida };
  }

  if (ubicacion.estado === "sin_pedir") {
    return { tipo: "bienvenida" };
  }

  if (
    ubicacion.estado === "negada" ||
    ubicacion.estado === "fallida" ||
    ubicacion.estado === "no_disponible"
  ) {
    return { tipo: "sin_ubicacion", motivo: ubicacion.estado };
  }

  return faseDeLaBusqueda(cercanas, masCercana);
}

function faseDeLaBusqueda(
  cercanas: Resultado<ParadaConRutas[]> | null,
  masCercana: ParadaConRutas | null,
): Fase {
  if (cercanas === null) {
    return { tipo: "buscando" };
  }

  if (!cercanas.ok) {
    return { tipo: "error", mensaje: cercanas.error };
  }

  return cercanas.datos.length === 0
    ? { tipo: "sin_paradas", masCercana }
    : { tipo: "selector", paradas: cercanas.datos };
}
