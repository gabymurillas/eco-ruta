"use client";

import { useEffect, useMemo, useState } from "react";
import { armarRecorrido, type FilaDeRecorrido, type Recorrido } from "@/domain/recorrido";
import { obtenerRecorrido } from "@/services/recorrido.service";

/** El mismo ritmo que «mi parada»: los dos muestran las mismas unidades. */
const SEGUNDOS_ENTRE_REFRESCOS = 15;

export type EstadoRecorrido = {
  /** Null hasta la primera respuesta buena: «cargando» no es «sin unidades». */
  recorrido: Recorrido | null;
  /**
   * Mensaje del último refresco fallido. El recorrido anterior se conserva: con
   * mala señal es mejor un dato de hace 15 s, avisado, que una pantalla vacía.
   */
  falla: string | null;
};

type Ajustes = { umbralSinSenalS: number; penalizacionIncidenciaPct: number };

export function useRecorrido(
  rutaId: string,
  { umbralSinSenalS, penalizacionIncidenciaPct }: Ajustes,
): EstadoRecorrido {
  const [filas, setFilas] = useState<FilaDeRecorrido[] | null>(null);
  const [falla, setFalla] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;

    const refrescar = () => {
      obtenerRecorrido(rutaId).then((resultado) => {
        if (!vigente) {
          return;
        }

        if (resultado.ok) {
          setFilas(resultado.datos);
          setFalla(null);
        } else {
          setFalla(resultado.error);
        }
      });
    };

    refrescar();
    const intervalo = setInterval(refrescar, SEGUNDOS_ENTRE_REFRESCOS * 1000);

    return () => {
      vigente = false;
      clearInterval(intervalo);
    };
  }, [rutaId]);

  const recorrido = useMemo(
    () => (filas ? armarRecorrido(filas, { umbralSinSenalS, penalizacionIncidenciaPct }) : null),
    [filas, umbralSinSenalS, penalizacionIncidenciaPct],
  );

  return { recorrido, falla };
}
