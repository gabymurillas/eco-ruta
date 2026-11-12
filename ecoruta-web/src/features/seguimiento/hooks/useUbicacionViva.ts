"use client";

import { useEffect, useState } from "react";
import { vigilarUbicacion } from "@/services/ubicacion.service";
import type { Ubicacion } from "../types";

/**
 * La ubicación que se dibuja en el mapa: arranca en la que se pidió al entrar y
 * se actualiza mientras el ciudadano camina. Sin permiso concedido no vigila.
 */
export function useUbicacionViva(inicial: Ubicacion | null): Ubicacion | null {
  const [viva, setViva] = useState<Ubicacion | null>(null);
  const permitida = inicial !== null;

  useEffect(() => {
    if (!permitida) {
      return;
    }

    return vigilarUbicacion(setViva);
  }, [permitida]);

  return permitida ? (viva ?? inicial) : null;
}
