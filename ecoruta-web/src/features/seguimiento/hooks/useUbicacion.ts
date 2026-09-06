"use client";

import { useEffect, useState } from "react";
import { obtenerUbicacionActual } from "@/services/ubicacion.service";
import type { EstadoUbicacion } from "../types";

/**
 * Ubicación del ciudadano, leída una sola vez al abrir la pantalla.
 *
 * No hay seguimiento continuo a propósito: el geofencing se evalúa en el servidor
 * contra la posición de la unidad, así que la web no necesita vigilar al ciudadano
 * ni gastarle batería y datos móviles.
 */
export function useUbicacion(): EstadoUbicacion {
  const [estado, setEstado] = useState<EstadoUbicacion>({ estado: "pidiendo" });

  useEffect(() => {
    let vigente = true;

    obtenerUbicacionActual().then((resultado) => {
      if (vigente) {
        setEstado(resultado);
      }
    });

    return () => {
      vigente = false;
    };
  }, []);

  return estado;
}
