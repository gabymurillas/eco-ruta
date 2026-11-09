"use client";

import { DivIcon } from "leaflet";
import { useMemo } from "react";
import { Marker } from "react-leaflet";
import { Mapa } from "@/components/mapa/Mapa";
import { TrazadoRuta } from "@/components/mapa/CapasDeRuta";
import { trazadoALatLng, ZOOM_PARADA, type Punto } from "@/domain/mapa";

export type PropsLienzoIncidencia = {
  ubicacion: Punto;
  trazado: unknown;
  color: string | null;
  titulo: string;
};

/**
 * Dónde se reportó la incidencia, sobre el trazado de su ruta. Se centra en el
 * punto y no en la ruta entera: lo que el gestor quiere ver es la calle.
 */
export function LienzoIncidencia({ ubicacion, trazado, color, titulo }: PropsLienzoIncidencia) {
  const icono = useMemo(
    () =>
      new DivIcon({
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        // Fondo de superficie y triángulo en el color de advertencia: el mismo
        // signo que la lista, para que se reconozca sin leyenda.
        html: `<span style="display:grid;place-items:center;width:32px;height:32px;border-radius:999px;background:var(--color-superficie);border:2px solid var(--color-advertencia);color:var(--color-advertencia);box-shadow:0 1px 4px rgb(0 0 0 / .25)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17v.1"/></svg></span>`,
      }),
    [],
  );

  return (
    <Mapa encuadrar={[ubicacion]} zoom={ZOOM_PARADA} className="size-full">
      <TrazadoRuta puntos={trazadoALatLng(trazado)} color={color} />
      <Marker position={[ubicacion.lat, ubicacion.lng]} icon={icono} alt={titulo} />
    </Mapa>
  );
}
