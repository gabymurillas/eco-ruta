"use client";

import { useEffect, useState } from "react";
import { obtenerLlegadas, type LlegadaRow } from "@/services/llegadas.service";

/**
 * Las llegadas se refrescan solas mientras el ciudadano mira la pantalla. Los
 * avisos llegan por Realtime; esto es lo que mueve el mapa y la lista.
 */
const SEGUNDOS_ENTRE_REFRESCOS = 15;

export function useLlegadas(paradaId: string | null): LlegadaRow[] {
  const [llegadas, setLlegadas] = useState<LlegadaRow[]>([]);

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

  return llegadas;
}
