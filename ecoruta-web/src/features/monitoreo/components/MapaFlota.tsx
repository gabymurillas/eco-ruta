"use client";

import dynamic from "next/dynamic";
import { colorDeRutaAdaptable } from "@/domain/colores";
import type {
  ParadaEnMapa,
  RutaEnMapa,
  SeleccionEnMapa,
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
  seleccion?: SeleccionEnMapa;
};

export function MapaFlota(props: Props) {
  return (
    <div className="relative size-full overflow-hidden rounded-2xl border border-borde">
      <Lienzo {...props} />
      <LeyendaDeRutas rutas={props.rutas} />
    </div>
  );
}

/**
 * Sin leyenda, el gestor tenía que abrir cada marcador para saber qué línea es
 * de qué ruta. Va con nombre además del color: el color nunca va solo.
 */
function LeyendaDeRutas({ rutas }: { rutas: readonly RutaEnMapa[] }) {
  if (rutas.length === 0) {
    return null;
  }

  return (
    // Por encima de los paneles de Leaflet (z 400) y por debajo de sus controles.
    <div className="absolute bottom-3 left-3 z-[500] max-w-60 rounded-xl border-[0.5px] border-borde bg-superficie px-3 py-2.5">
      <h2 className="sr-only">Rutas en el mapa</h2>
      <ul className="flex flex-col gap-1.5">
        {rutas.map((ruta) => (
          <li key={ruta.id} className="flex items-center gap-2 text-xs font-semibold">
            <span
              aria-hidden="true"
              className="h-1 w-4 shrink-0 rounded-full"
              style={{ backgroundColor: colorDeRutaAdaptable(ruta.color) }}
            />
            <span className="truncate">{ruta.nombre}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
