"use client";

import { Mapa } from "@/components/mapa/Mapa";
import { TrazadoRuta } from "@/components/mapa/CapasDeRuta";
import type { Punto } from "@/domain/mapa";

export type PropsLienzoVistaPrevia = {
  trazado: Punto[];
  color: string;
};

export function LienzoVistaPrevia({ trazado, color }: PropsLienzoVistaPrevia) {
  return (
    <Mapa encuadrar={trazado} estatico className="size-full">
      <TrazadoRuta puntos={trazado} color={color} />
    </Mapa>
  );
}
