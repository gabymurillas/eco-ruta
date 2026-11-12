"use client";

import { useEffect, useState } from "react";
import { vigilarUbicacion } from "@/services/ubicacion.service";
import type { Ubicacion } from "../types";

/**
 * La ubicación que se dibuja en el mapa: arranca en la que se pidió al entrar y
 * se actualiza mientras el ciudadano camina. Sin permiso concedido no vigila, y
 * con la página oculta tampoco.
 */
export function useUbicacionViva(inicial: Ubicacion | null): Ubicacion | null {
  const [viva, setViva] = useState<Ubicacion | null>(null);
  const permitida = inicial !== null;

  useEffect(() => {
    if (!permitida) {
      return;
    }

    // Con la página oculta (otra app, pantalla apagada) el GPS se apaga: en un
    // teléfono de gama baja la alta precisión continua se come la batería.
    let dejarDeVigilar = document.hidden ? null : vigilarUbicacion(setViva);

    const alCambiarVisibilidad = () => {
      dejarDeVigilar?.();
      dejarDeVigilar = document.hidden ? null : vigilarUbicacion(setViva);
    };

    document.addEventListener("visibilitychange", alCambiarVisibilidad);

    return () => {
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
      dejarDeVigilar?.();
    };
  }, [permitida]);

  return permitida ? (viva ?? inicial) : null;
}
