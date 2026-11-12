"use client";

import { createContext, useContext } from "react";

/** La ruta que el ciudadano tocó para verla en el mapa, y la unidad que sigue la cámara. */
export type RutaSeguida = {
  rutaId: string;
  /** Null si la ruta no tiene ninguna unidad en camino: se muestra solo su trazado. */
  unidadId: string | null;
};

type ContextoSeguir = {
  seguida: RutaSeguida | null;
  /** Sin unidad, la cámara sigue a la unidad de esa ruta más próxima a la parada. */
  seguir: (rutaId: string, unidadId?: string) => void;
};

export const ContextoSeguirRuta = createContext<ContextoSeguir>({
  seguida: null,
  seguir: () => {},
});

export function useSeguirRuta(): ContextoSeguir {
  return useContext(ContextoSeguirRuta);
}
