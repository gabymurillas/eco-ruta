"use client";

import { DivIcon } from "leaflet";
import { useMemo, useState } from "react";
import { Circle, Marker, Tooltip } from "react-leaflet";
import { CapturarClics, VolarA, type Destino } from "@/components/mapa/ControlesDeMapa";
import { TrazadoRuta } from "@/components/mapa/CapasDeRuta";
import { Mapa } from "@/components/mapa/Mapa";
import type { Punto } from "@/domain/mapa";
import type { Ficha, ParadaDeLaCiudad } from "../hooks/useEditorDeParadas";

export type TrazadoVisible = {
  id: string;
  color: string;
  puntos: Punto[];
};

type Props = {
  paradas: readonly ParadaDeLaCiudad[];
  /** Las rutas se dibujan atenuadas: dejan ver por dónde pasa cada una. */
  trazados: readonly TrazadoVisible[];
  ficha: Ficha | null;
  destino: Destino | null;
  onClicEnMapa: (punto: Punto) => void;
  onSeleccionarParada: (paradaId: string) => void;
  onMoverFicha: (punto: Punto) => void;
};

/**
 * Las paradas son de la ciudad, no de una ruta: se dibujan en tinta, no en el
 * color de una ruta. Las que no tocan ningún trazado van huecas, para que el
 * admin vea de un vistazo cuáles todavía no tienen servicio.
 */
export function LienzoParadas({
  paradas,
  trazados,
  ficha,
  destino,
  onClicEnMapa,
  onSeleccionarParada,
  onMoverFicha,
}: Props) {
  // Se encuadra una sola vez, al abrir: si siguiera a la lista, cada parada
  // guardada alejaría el mapa a toda la ciudad y el admin perdería su zoom.
  const [encuadrar] = useState<Punto[]>(() => paradas.map(({ lat, lng }) => ({ lat, lng })));

  return (
    <Mapa encuadrar={encuadrar} className="size-full">
      <CapturarClics onClic={onClicEnMapa} />
      <VolarA destino={destino} />

      {trazados.map((trazado) => (
        <TrazadoRuta key={trazado.id} puntos={trazado.puntos} color={trazado.color} secundario />
      ))}

      {paradas
        .filter((parada) => parada.id !== ficha?.paradaId)
        .map((parada) => (
          <MarcadorDeParada
            key={parada.id}
            punto={parada}
            sinRuta={parada.rutas.length === 0}
            etiqueta={`${parada.nombre} · ${parada.rutas.length === 0 ? "sin rutas" : parada.rutas.map((r) => r.nombre).join(", ")}`}
            onClic={() => onSeleccionarParada(parada.id)}
          />
        ))}

      {ficha && <ParadaEnFicha ficha={ficha} onMover={onMoverFicha} />}
    </Mapa>
  );
}

type PropsMarcador = {
  punto: Punto;
  sinRuta: boolean;
  etiqueta: string;
  onClic: () => void;
};

function MarcadorDeParada({ punto, sinRuta, etiqueta, onClic }: PropsMarcador) {
  const icono = useMemo(() => construirIcono({ editando: false, sinRuta }), [sinRuta]);

  return (
    <Marker
      position={[punto.lat, punto.lng]}
      icon={icono}
      alt={etiqueta}
      eventHandlers={{ click: onClic }}
    >
      <Tooltip direction="top" offset={[0, -10]}>
        {etiqueta}
      </Tooltip>
    </Marker>
  );
}

/**
 * La parada abierta en la ficha: la única que se arrastra, con su geocerca a la
 * vista. El radio va en metros y Leaflet lo reescala con el zoom, así se calibra
 * viendo su tamaño real sobre la calle.
 */
function ParadaEnFicha({ ficha, onMover }: { ficha: Ficha; onMover: (punto: Punto) => void }) {
  const icono = useMemo(() => construirIcono({ editando: true, sinRuta: false }), []);

  return (
    <>
      <Circle
        center={[ficha.lat, ficha.lng]}
        radius={ficha.radioM}
        pathOptions={{
          color: COLOR_EDICION,
          fillColor: COLOR_EDICION,
          fillOpacity: 0.12,
          weight: 2,
          dashArray: ficha.paradaId === null ? "6 5" : undefined,
        }}
      />
      <Marker
        position={[ficha.lat, ficha.lng]}
        icon={icono}
        draggable
        alt={ficha.nombre}
        eventHandlers={{
          dragend: (evento) => {
            const { lat, lng } = evento.target.getLatLng();
            onMover({ lat, lng });
          },
        }}
      >
        <Tooltip direction="top" offset={[0, -14]} permanent>
          {ficha.nombre || "Nueva parada"}
        </Tooltip>
      </Marker>
    </>
  );
}

/**
 * Leaflet escribe el color de la geocerca como atributo SVG, donde las variables
 * de CSS no funcionan: va fijo, en un azul que se distingue en los dos temas y
 * que no es color de ninguna ruta.
 */
const COLOR_EDICION = "oklch(58% 0.14 240)";

/**
 * Los marcadores sí son HTML: usan los colores del tema y se leen igual en
 * claro y en oscuro. La parada abierta va en el azul de edición, como su geocerca.
 */
function construirIcono({ editando, sinRuta }: { editando: boolean; sinRuta: boolean }): DivIcon {
  const diametro = editando ? 26 : 16;
  const borde = editando ? 5 : 3;
  const relleno = sinRuta ? "transparent" : "var(--color-superficie)";
  const estilo = sinRuta ? "dashed" : "solid";
  const color = editando ? COLOR_EDICION : "var(--color-tinta)";

  return new DivIcon({
    className: "",
    iconSize: [diametro, diametro],
    iconAnchor: [diametro / 2, diametro / 2],
    html: `<span style="display:block;width:${diametro}px;height:${diametro}px;border-radius:999px;background:${relleno};border:${borde}px ${estilo} ${color};cursor:${editando ? "grab" : "pointer"}"></span>`,
  });
}
