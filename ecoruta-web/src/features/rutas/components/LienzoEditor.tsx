"use client";

import { Circle, CircleMarker, Marker, Polyline, Tooltip, useMapEvents } from "react-leaflet";
import { DivIcon, type LeafletMouseEvent } from "leaflet";
import { useMemo } from "react";
import { Mapa } from "@/components/mapa/Mapa";
import { colorDeRuta } from "@/domain/colores";
import type { Punto } from "@/domain/mapa";

export type ParadaEditable = {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  radioM: number;
};

export type Modo = "paradas" | "trazado";

type Props = {
  color: string | null;
  paradas: readonly ParadaEditable[];
  trazado: readonly Punto[];
  modo: Modo;
  paradaSeleccionada: string | null;
  onClicEnMapa: (punto: Punto) => void;
  onSeleccionarParada: (paradaId: string) => void;
  onMoverParada: (paradaId: string, punto: Punto) => void;
};

export function LienzoEditor({
  color,
  paradas,
  trazado,
  modo,
  paradaSeleccionada,
  onClicEnMapa,
  onSeleccionarParada,
  onMoverParada,
}: Props) {
  const tono = colorDeRuta(color);

  const encuadrar: Punto[] = [
    ...paradas.map(({ lat, lng }) => ({ lat, lng })),
    ...trazado,
  ];

  return (
    <Mapa encuadrar={encuadrar} className="size-full">
      <CapturarClics onClic={onClicEnMapa} />

      {trazado.length >= 2 && (
        <Polyline
          positions={trazado.map((punto) => [punto.lat, punto.lng])}
          pathOptions={{ color: tono, weight: 5, opacity: 0.9 }}
        />
      )}

      {/* En modo trazado cada vértice es visible y numerable: sin esto el admin no
          sabe dónde hizo clic ni cuántos puntos lleva. */}
      {modo === "trazado" &&
        trazado.map((punto, indice) => (
          <CircleMarker
            key={`${punto.lat},${punto.lng},${indice}`}
            center={[punto.lat, punto.lng]}
            radius={5}
            pathOptions={{
              color: tono,
              fillColor: "oklch(99% 0.008 75)",
              fillOpacity: 1,
              weight: 2,
            }}
          >
            <Tooltip direction="top">Punto {indice + 1}</Tooltip>
          </CircleMarker>
        ))}

      {paradas.map((parada) => (
        <ParadaEnEdicion
          key={parada.id}
          parada={parada}
          tono={tono}
          seleccionada={parada.id === paradaSeleccionada}
          arrastrable={modo === "paradas"}
          onSeleccionar={() => onSeleccionarParada(parada.id)}
          onMover={(punto) => onMoverParada(parada.id, punto)}
        />
      ))}
    </Mapa>
  );
}

function CapturarClics({ onClic }: { onClic: (punto: Punto) => void }) {
  useMapEvents({
    click: (evento: LeafletMouseEvent) => {
      onClic({ lat: evento.latlng.lat, lng: evento.latlng.lng });
    },
  });

  return null;
}

type PropsParada = {
  parada: ParadaEditable;
  tono: string;
  seleccionada: boolean;
  arrastrable: boolean;
  onSeleccionar: () => void;
  onMover: (punto: Punto) => void;
};

function ParadaEnEdicion({
  parada,
  tono,
  seleccionada,
  arrastrable,
  onSeleccionar,
  onMover,
}: PropsParada) {
  const marcador = useMemo(
    () => construirMarcadorParada(tono, seleccionada),
    [tono, seleccionada],
  );

  return (
    <>
      {/* El radio va en metros y Leaflet lo reescala solo con el zoom: es lo que
          permite calibrar la geocerca viendo su tamaño real sobre la calle. */}
      <Circle
        center={[parada.lat, parada.lng]}
        radius={parada.radioM}
        pathOptions={{
          color: tono,
          fillColor: tono,
          fillOpacity: seleccionada ? 0.2 : 0.08,
          weight: seleccionada ? 2 : 1,
          dashArray: seleccionada ? undefined : "5 6",
        }}
      />

      <Marker
        position={[parada.lat, parada.lng]}
        icon={marcador}
        draggable={arrastrable}
        alt={parada.nombre}
        eventHandlers={{
          click: onSeleccionar,
          dragend: (evento) => {
            const { lat, lng } = evento.target.getLatLng();
            onMover({ lat, lng });
          },
        }}
      >
        <Tooltip direction="top" offset={[0, -12]}>
          {parada.nombre} · {parada.radioM} m
        </Tooltip>
      </Marker>
    </>
  );
}

function construirMarcadorParada(tono: string, seleccionada: boolean): DivIcon {
  const diametro = seleccionada ? 22 : 16;

  return new DivIcon({
    className: "",
    iconSize: [diametro, diametro],
    iconAnchor: [diametro / 2, diametro / 2],
    html: `<span style="display:block;width:${diametro}px;height:${diametro}px;border-radius:999px;background:oklch(99% 0.008 75);border:${seleccionada ? 4 : 3}px solid ${tono};cursor:${seleccionada ? "grab" : "pointer"}"></span>`,
  });
}
