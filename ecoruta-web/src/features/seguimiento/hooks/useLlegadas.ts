"use client";

import { useEffect, useState } from "react";
import { obtenerLlegadas, type LlegadaRow } from "@/services/llegadas.service";

/**
 * Las llegadas se refrescan solas mientras el ciudadano mira la pantalla. Los
 * avisos llegan por Realtime; esto es lo que mueve el mapa y la lista.
 */
const SEGUNDOS_ENTRE_REFRESCOS = 15;

export type EstadoLlegadas = {
  /** Null hasta la primera respuesta buena: «cargando» no es «no hay unidades». */
  llegadas: LlegadaRow[] | null;
  /**
   * Mensaje del último refresco fallido. Las llegadas anteriores se conservan:
   * con mala señal es mejor un dato de hace 15 s, avisado, que una pantalla vacía.
   * El refresco periódico ya es el reintento.
   */
  falla: string | null;
};

const SIN_DATOS: EstadoLlegadas = { llegadas: null, falla: null };

export function useLlegadas(paradaId: string | null): EstadoLlegadas {
  const [estado, setEstado] = useState<EstadoLlegadas & { paradaId: string | null }>({
    ...SIN_DATOS,
    paradaId,
  });

  useEffect(() => {
    if (!paradaId) {
      return;
    }

    let vigente = true;

    const refrescar = () => {
      obtenerLlegadas(paradaId).then((resultado) => {
        if (!vigente) {
          return;
        }

        setEstado((anterior) => {
          const llegadasPrevias =
            anterior.paradaId === paradaId ? anterior.llegadas : null;

          return resultado.ok
            ? { llegadas: resultado.datos, falla: null, paradaId }
            : { llegadas: llegadasPrevias, falla: resultado.error, paradaId };
        });
      });
    };

    refrescar();
    const intervalo = setInterval(refrescar, SEGUNDOS_ENTRE_REFRESCOS * 1000);

    return () => {
      vigente = false;
      clearInterval(intervalo);
    };
  }, [paradaId]);

  // Al cambiar de parada, lo de la anterior no se muestra ni un instante.
  return estado.paradaId === paradaId ? estado : SIN_DATOS;
}
