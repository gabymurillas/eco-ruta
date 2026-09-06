"use client";

import { useEffect, useState } from "react";
import { buscarParadasCercanas } from "@/services/paradas.service";
import type { Resultado } from "@/services/resultado";
import { agruparPorParada, type ParadaConRutas } from "../types";
import { useUbicacion } from "./useUbicacion";

type EstadoCarga = "cargando" | "listo" | "error";

/**
 * Único punto de la feature que habla con la capa de servicios.
 * Los componentes reciben todo desde aquí por props.
 */
export function useSeguimiento() {
  const ubicacion = useUbicacion();
  const [respuesta, setRespuesta] = useState<Resultado<
    ParadaConRutas[]
  > | null>(null);

  useEffect(() => {
    if (ubicacion.estado !== "concedida") {
      return;
    }

    let vigente = true;
    const { lat, lng } = ubicacion.ubicacion;

    buscarParadasCercanas({ lat, lng }).then((resultado) => {
      if (!vigente) {
        return;
      }

      setRespuesta(
        resultado.ok
          ? { ok: true, datos: agruparPorParada(resultado.datos) }
          : resultado,
      );
    });

    return () => {
      vigente = false;
    };
  }, [ubicacion]);

  // El estado de carga se deriva, no se guarda: una sola fuente de verdad.
  const carga: EstadoCarga = derivarCarga(ubicacion.estado, respuesta);
  const paradas = respuesta?.ok ? respuesta.datos : [];
  const [paradaMasCercana, ...otrasParadas] = paradas;

  return {
    ubicacion,
    carga,
    error: respuesta && !respuesta.ok ? respuesta.error : null,
    paradaMasCercana: paradaMasCercana ?? null,
    otrasParadas,
  };
}

function derivarCarga(
  estadoUbicacion: string,
  respuesta: Resultado<ParadaConRutas[]> | null,
): EstadoCarga {
  if (estadoUbicacion === "pidiendo") {
    return "cargando";
  }

  if (estadoUbicacion !== "concedida") {
    return "listo";
  }

  if (respuesta === null) {
    return "cargando";
  }

  return respuesta.ok ? "listo" : "error";
}
