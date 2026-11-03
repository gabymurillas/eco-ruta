"use client";

import { DivIcon } from "leaflet";
import { useMemo } from "react";
import { CircleMarker, Marker, Polyline, Tooltip } from "react-leaflet";
import { CapturarClics } from "@/components/mapa/ControlesDeMapa";
import { Mapa } from "@/components/mapa/Mapa";
import { colorDeRuta } from "@/domain/colores";
import type { Punto } from "@/domain/mapa";

export type ParadaEnMapa = Punto & {
  id: string;
  nombre: string;
  /** Posición en el recorrido si la ruta pasa por ella; null si no. */
  orden: number | null;
};

type Props = {
  color: string | null;
  trazado: readonly Punto[];
  paradas: readonly ParadaEnMapa[];
  onClicEnMapa: (punto: Punto) => void;
};

/**
 * Cada clic agrega un punto al recorrido. Las paradas de la ciudad se ven
 * todas: las que toca el trazado guardado, numeradas en el color de la ruta;
 * las demás en gris, para saber hacia dónde llevar la línea.
 */
export function LienzoEditor({ color, trazado, paradas, onClicEnMapa }: Props) {
  const tono = colorDeRuta(color);
  const encuadrar: Punto[] = [...paradas.map(({ lat, lng }) => ({ lat, lng })), ...trazado];

  return (
    <Mapa encuadrar={encuadrar} className="size-full [&.leaflet-container]:cursor-crosshair">
      <CapturarClics onClic={onClicEnMapa} />

      {trazado.length >= 2 && (
        <Polyline
          positions={trazado.map((punto) => [punto.lat, punto.lng])}
          pathOptions={{ color: tono, weight: 5, opacity: 0.9 }}
        />
      )}

      {/* Cada vértice es visible y numerable: sin esto el admin no sabe dónde
          hizo clic ni cuántos puntos lleva. */}
      {trazado.map((punto, indice) => (
        <CircleMarker
          key={`${punto.lat},${punto.lng},${indice}`}
          center={[punto.lat, punto.lng]}
          radius={5}
          pathOptions={{ color: tono, fillColor: "oklch(99% 0.008 75)", fillOpacity: 1, weight: 2 }}
        >
          <Tooltip direction="top">Punto {indice + 1}</Tooltip>
        </CircleMarker>
      ))}

      {paradas.map((parada) => (
        <MarcadorParada key={parada.id} parada={parada} tono={tono} />
      ))}
    </Mapa>
  );
}

function MarcadorParada({ parada, tono }: { parada: ParadaEnMapa; tono: string }) {
  const icono = useMemo(() => construirIcono(parada.orden, tono), [parada.orden, tono]);

  return (
    <Marker position={[parada.lat, parada.lng]} icon={icono} alt={parada.nombre} interactive>
      <Tooltip direction="top" offset={[0, -12]}>
        {parada.orden === null ? `${parada.nombre} · la ruta no pasa por aquí` : `${parada.orden}. ${parada.nombre}`}
      </Tooltip>
    </Marker>
  );
}

function construirIcono(orden: number | null, tono: string): DivIcon {
  if (orden === null) {
    return new DivIcon({
      className: "",
      iconSize: [12, 12],
      iconAnchor: [6, 6],
      html: `<span style="display:block;width:12px;height:12px;border-radius:999px;background:oklch(99% 0.008 75);border:2px solid oklch(62% 0.02 60)"></span>`,
    });
  }

  return new DivIcon({
    className: "",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    html: `<span style="display:flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:999px;background:oklch(99% 0.008 75);border:3px solid ${tono};font:700 11px 'Source Sans 3',system-ui,sans-serif;color:oklch(25% 0.02 60)">${orden}</span>`,
  });
}
