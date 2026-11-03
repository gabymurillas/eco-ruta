"use client";

import { DivIcon } from "leaflet";
import { useMemo } from "react";
import { Marker, Polyline, Popup, Tooltip } from "react-leaflet";
import { CapturarClics } from "@/components/mapa/ControlesDeMapa";
import { Mapa } from "@/components/mapa/Mapa";
import { colorDeRuta, tintaSobreColorDeRuta } from "@/domain/colores";
import type { Punto } from "@/domain/mapa";
import type { PuntoClave } from "../hooks/useEditorDeRuta";

export type ParadaEnMapa = Punto & {
  id: string;
  nombre: string;
  /** Posición en el recorrido si la ruta pasa por ella; null si no. */
  orden: number | null;
};

type Props = {
  color: string | null;
  linea: readonly Punto[];
  puntos: readonly PuntoClave[];
  paradas: readonly ParadaEnMapa[];
  onClicEnMapa: (punto: Punto) => void;
  onMoverPunto: (indice: number, punto: Punto) => void;
  onQuitarPunto: (indice: number) => void;
  onAlternarRecto: (indice: number) => void;
};

/**
 * La línea es lo calculado; los puntos clave, lo que el admin decide. Las
 * paradas de la ciudad se ven todas: las que toca el trazado guardado,
 * numeradas en el color de la ruta; las demás en gris, para saber hacia dónde
 * llevar la línea.
 */
export function LienzoEditor(props: Props) {
  const { color, linea, puntos, paradas, onClicEnMapa } = props;
  const tono = colorDeRuta(color);
  const tinta = tintaSobreColorDeRuta(color);
  const encuadrar: Punto[] = [...paradas.map(({ lat, lng }) => ({ lat, lng })), ...linea];

  return (
    <Mapa encuadrar={encuadrar} className="size-full [&.leaflet-container]:cursor-crosshair">
      <CapturarClics onClic={onClicEnMapa} />

      {linea.length >= 2 && (
        <Polyline
          positions={linea.map((punto) => [punto.lat, punto.lng])}
          pathOptions={{ color: tono, weight: 5, opacity: 0.9, lineJoin: "round", lineCap: "round" }}
        />
      )}

      {paradas.map((parada) => (
        <MarcadorParada key={parada.id} parada={parada} tono={tono} />
      ))}

      {puntos.map((punto, indice) => (
        <MarcadorPuntoClave
          key={indice}
          punto={punto}
          indice={indice}
          total={puntos.length}
          tono={tono}
          tinta={tinta}
          {...props}
        />
      ))}
    </Mapa>
  );
}

type PropsPunto = Props & {
  punto: PuntoClave;
  indice: number;
  total: number;
  tono: string;
  /** Mostaza es claro: lleva el número en tinta oscura (ver CLAUDE.md, colores de ruta). */
  tinta: string;
};

function MarcadorPuntoClave({ punto, indice, total, tono, tinta, onMoverPunto, onQuitarPunto, onAlternarRecto }: PropsPunto) {
  const etiqueta = indice === 0 ? "Inicio" : indice === total - 1 ? "Fin" : String(indice + 1);
  const icono = useMemo(() => iconoPuntoClave(etiqueta, tono, tinta), [etiqueta, tono, tinta]);

  return (
    <Marker
      position={[punto.lat, punto.lng]}
      icon={icono}
      draggable
      alt={`Punto ${indice + 1}`}
      eventHandlers={{
        dragend: (evento) => {
          const { lat, lng } = evento.target.getLatLng();
          onMoverPunto(indice, { lat, lng });
        },
      }}
    >
      <Popup>
        <div className="flex flex-col gap-2 font-sans">
          <span className="text-[13px] font-bold">Punto {indice + 1}</span>
          {indice > 0 && (
            <label className="flex items-center gap-2 text-[13px]">
              <input
                type="checkbox"
                checked={punto.recto}
                onChange={() => onAlternarRecto(indice)}
                className="accent-marca-profundo"
              />
              Llegar en línea recta
            </label>
          )}
          <button
            type="button"
            onClick={() => onQuitarPunto(indice)}
            className="self-start text-[13px] font-bold text-error underline"
          >
            Quitar punto
          </button>
        </div>
      </Popup>
    </Marker>
  );
}

function MarcadorParada({ parada, tono }: { parada: ParadaEnMapa; tono: string }) {
  const icono = useMemo(() => iconoParada(parada.orden, tono), [parada.orden, tono]);

  return (
    <Marker position={[parada.lat, parada.lng]} icon={icono} alt={parada.nombre} interactive>
      <Tooltip direction="top" offset={[0, -12]}>
        {parada.orden === null ? `${parada.nombre} · la ruta no pasa por aquí` : `${parada.orden}. ${parada.nombre}`}
      </Tooltip>
    </Marker>
  );
}

/** Los puntos clave son más grandes que las paradas y llevan su número: se arrastran. */
function iconoPuntoClave(etiqueta: string, tono: string, tinta: string): DivIcon {
  const ancho = etiqueta.length > 2 ? 44 : 26;

  return new DivIcon({
    className: "",
    iconSize: [ancho, 26],
    iconAnchor: [ancho / 2, 13],
    html: `<span style="display:flex;align-items:center;justify-content:center;width:${ancho}px;height:26px;border-radius:999px;background:${tono};color:${tinta};border:2px solid oklch(99% 0.008 75);font:700 11px 'Source Sans 3',system-ui,sans-serif;cursor:grab">${etiqueta}</span>`,
  });
}

function iconoParada(orden: number | null, tono: string): DivIcon {
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
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    html: `<span style="display:flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:999px;background:oklch(99% 0.008 75);border:3px solid ${tono};font:700 10px 'Source Sans 3',system-ui,sans-serif;color:oklch(25% 0.02 60)">${orden}</span>`,
  });
}
