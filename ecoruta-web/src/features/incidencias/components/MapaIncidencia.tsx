"use client";

import dynamic from "next/dynamic";
import type { PropsLienzoIncidencia } from "./LienzoIncidencia";

// Leaflet toca `window` al importarse: el lienzo queda fuera del render del servidor.
const Lienzo = dynamic(
  () => import("./LienzoIncidencia").then((modulo) => modulo.LienzoIncidencia),
  {
    ssr: false,
    loading: () => (
      <div className="flex size-full items-center justify-center bg-fondo">
        <p className="text-sm text-tinta-media">Cargando el mapa…</p>
      </div>
    ),
  },
);

export function MapaIncidencia(props: PropsLienzoIncidencia) {
  return (
    <div className="h-[190px] overflow-hidden rounded-xl border border-borde">
      <Lienzo {...props} />
    </div>
  );
}
