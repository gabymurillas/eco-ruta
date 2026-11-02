"use client";

import { useEffect, useState } from "react";
import {
  limitacionesYaVistas,
  marcarLimitacionesVistas,
} from "@/services/preferencias.service";

/**
 * El aviso de limitaciones se muestra hasta que el ciudadano lo cierra, una vez
 * por navegador. Arranca oculto y se decide al montar: localStorage no existe en
 * el servidor, y mostrarlo para luego quitarlo haría saltar la pantalla.
 */
export function useAvisoLimitaciones() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setVisible(!limitacionesYaVistas()));
  }, []);

  return {
    visible,
    cerrar: () => {
      marcarLimitacionesVistas();
      setVisible(false);
    },
  };
}
