"use client";

import dynamic from "next/dynamic";
import type {
  ParadaEnMapa,
  RutaEnMapa,
  UnidadEnMapa,
} from "./LienzoFlota";

/**
 * Envoltorio cliente del mapa.
 *
 * Existe porque `ssr: false` no se permite en Server Components en Next 16, y la
 * pantalla de monitoreo sí lo es. Leaflet toca `window` al importarse, así que el
 * lienzo tiene que quedar fuera del render del servidor.
 */
const Lienzo = dynamic(
  () => import("./LienzoFlota").then((modulo) => modulo.LienzoFlota),
  {
    ssr: false,
    loading: () => (
      <div className="flex size-full items-center justify-center rounded-2xl border-[0.5px] border-borde bg-fondo">
        <p className="text-sm text-tinta-media">Cargando el mapa…</p>
      </div>
    ),
  },
);

type Props = {
  unidades: readonly UnidadEnMapa[];
  rutas: readonly RutaEnMapa[];
  paradas?: readonly ParadaEnMapa[];
  mostrarGeocercas?: boolean;
};

export function MapaFlota(props: Props) {
  return (
    <div className="size-full overflow-hidden rounded-2xl border-[0.5px] border-borde">
      <Lienzo {...props} />
    </div>
  );
}
