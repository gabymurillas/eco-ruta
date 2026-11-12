"use client";

import { useEffect, useState } from "react";
import { obtenerHorariosDeRutas, type HorarioDeRuta } from "@/services/mapa-publico.service";

/**
 * Horario de las rutas de la parada. Solo se pide cuando hace falta (ninguna
 * unidad en camino), y si falla no se muestra nada: es información de apoyo.
 */
export function useHorarios(rutaIds: readonly string[], activo: boolean): HorarioDeRuta[] {
  const [horarios, setHorarios] = useState<HorarioDeRuta[]>([]);
  const clave = rutaIds.join("|");

  useEffect(() => {
    if (!activo || clave === "") {
      return;
    }

    let vigente = true;

    obtenerHorariosDeRutas(clave.split("|")).then((resultado) => {
      if (vigente) {
        setHorarios(resultado.ok ? resultado.datos : []);
      }
    });

    return () => {
      vigente = false;
    };
  }, [clave, activo]);

  return activo ? horarios : [];
}
