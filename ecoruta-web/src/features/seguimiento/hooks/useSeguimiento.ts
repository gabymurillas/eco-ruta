"use client";

import { useEffect, useState } from "react";
import { obtenerLlegadas, type LlegadaRow } from "@/services/llegadas.service";
import { buscarParadasCercanas } from "@/services/paradas.service";
import type { Resultado } from "@/services/resultado";
import { agruparPorParada, type ParadaConRutas } from "../types";
import { useUbicacion } from "./useUbicacion";

type EstadoCarga = "cargando" | "listo" | "error";

type Props = {
  umbralSinSenalS: number;
};

/**
 * Único punto de la feature que habla con la capa de servicios.
 *
 * Encadena dos pasos: la ubicación determina la parada más cercana, y esa parada
 * determina qué unidades vienen. Las llegadas se refrescan solas mientras el ciudadano
 * mira la pantalla; la parada no, porque no se va a mover mientras espera.
 */
const SEGUNDOS_ENTRE_REFRESCOS = 15;

export function useSeguimiento({ umbralSinSenalS }: Props) {
  const ubicacion = useUbicacion();
  const [respuesta, setRespuesta] = useState<Resultado<ParadaConRutas[]> | null>(null);
  const [llegadas, setLlegadas] = useState<LlegadaRow[]>([]);

  useEffect(() => {
    if (ubicacion.estado !== "concedida") {
      return;
    }

    let vigente = true;
    const { lat, lng } = ubicacion.ubicacion;

    buscarParadasCercanas({ lat, lng }).then((resultado) => {
      if (vigente) {
        setRespuesta(
          resultado.ok
            ? { ok: true, datos: agruparPorParada(resultado.datos) }
            : resultado,
        );
      }
    });

    return () => {
      vigente = false;
    };
  }, [ubicacion]);

  const paradas = respuesta?.ok ? respuesta.datos : [];
  const paradaMasCercana = paradas[0] ?? null;
  const paradaId = paradaMasCercana?.paradaId ?? null;

  useEffect(() => {
    if (!paradaId) {
      return;
    }

    let vigente = true;

    const refrescar = () => {
      obtenerLlegadas(paradaId).then((resultado) => {
        if (vigente && resultado.ok) {
          setLlegadas(resultado.datos);
        }
      });
    };

    refrescar();
    const intervalo = setInterval(refrescar, SEGUNDOS_ENTRE_REFRESCOS * 1000);

    return () => {
      vigente = false;
      clearInterval(intervalo);
    };
  }, [paradaId]);

  return {
    ubicacion,
    carga: derivarCarga(ubicacion.estado, respuesta),
    error: respuesta && !respuesta.ok ? respuesta.error : null,
    paradaMasCercana,
    // El mapa dibuja todas las paradas cercanas, no solo la elegida: ver las de
    // alrededor ayuda al ciudadano a ubicarse.
    paradasCercanas: paradas,
    otrasParadas: paradas.slice(1),
    llegadas,
    umbralSinSenalS,
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
