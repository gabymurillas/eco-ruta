"use client";

import { DivIcon } from "leaflet";
import { useMemo } from "react";
import { Circle, CircleMarker, Marker, Polyline, Popup, Tooltip } from "react-leaflet";
import { claseDeRuta, colorDeRuta } from "@/domain/colores";
import type { Punto } from "@/domain/mapa";

type PropsTrazado = {
  puntos: readonly Punto[];
  color: string | null;
  /** Atenuado cuando la ruta no es la que el ciudadano está siguiendo. */
  secundario?: boolean;
};

export function TrazadoRuta({ puntos, color, secundario = false }: PropsTrazado) {
  if (puntos.length < 2) {
    return null;
  }

  return (
    <Polyline
      positions={puntos.map((punto) => [punto.lat, punto.lng])}
      pathOptions={{
        color: colorDeRuta(color),
        className: claseDeRuta(color),
        weight: secundario ? 4 : 5,
        opacity: secundario ? 0.45 : 0.9,
        lineCap: "round",
        lineJoin: "round",
      }}
    />
  );
}

type PropsParada = {
  lat: number;
  lng: number;
  nombre: string;
  radioM: number;
  color: string | null;
  /** La parada del ciudadano se resalta; las demás son referencia. */
  destacada?: boolean;
  /** El círculo de geocerca solo interesa al admin que la está calibrando. */
  mostrarGeocerca?: boolean;
};

export function MarcadorParada({
  lat,
  lng,
  nombre,
  radioM,
  color,
  destacada = false,
  mostrarGeocerca = false,
}: PropsParada) {
  const tono = colorDeRuta(color);

  return (
    <>
      {mostrarGeocerca && (
        // `Circle` recibe el radio en METROS y lo reescala solo con el zoom. Es la
        // razón principal por la que este proyecto usa Leaflet: en un motor vectorial
        // habria que generar el poligono a mano y recalcularlo en cada zoom.
        <Circle
          center={[lat, lng]}
          radius={radioM}
          pathOptions={{
            color: tono,
            fillColor: tono,
            fillOpacity: 0.12,
            weight: 1,
            dashArray: "5 6",
            className: `${claseDeRuta(color)} ruta-relleno`,
          }}
        />
      )}

      <CircleMarker
        center={[lat, lng]}
        radius={destacada ? 8 : 6}
        pathOptions={{
          color: tono,
          className: claseDeRuta(color),
          fillColor: "oklch(99% 0.008 75)",
          fillOpacity: 1,
          weight: destacada ? 4 : 2.5,
        }}
      >
        <Tooltip direction="top" offset={[0, -8]}>
          {nombre}
          {mostrarGeocerca && ` · geocerca de ${radioM} m`}
        </Tooltip>
      </CircleMarker>
    </>
  );
}

type PropsUbicacion = {
  lat: number;
  lng: number;
  exactitudM: number;
};

/**
 * Ubicación del ciudadano: punto azul con aro de precisión.
 *
 * El azul está reservado a esto y no se usa para ninguna ruta, justamente para que
 * nadie confunda su propia posición con la de una unidad.
 */
export function MarcadorUbicacion({ lat, lng, exactitudM }: PropsUbicacion) {
  const azul = "oklch(55% 0.15 250)";

  const punto = useMemo(
    () =>
      new DivIcon({
        className: "",
        iconSize: [18, 18],
        iconAnchor: [9, 9],
        html: `<span style="display:block;width:18px;height:18px;border-radius:999px;background:${azul};border:3px solid oklch(99% 0.008 75)"></span>`,
      }),
    [],
  );

  return (
    <>
      <Circle
        center={[lat, lng]}
        radius={exactitudM}
        pathOptions={{
          color: azul,
          fillColor: azul,
          fillOpacity: 0.12,
          weight: 1,
        }}
      />
      <Marker position={[lat, lng]} icon={punto} alt="Tu ubicación">
        <Popup>Estás aquí, con una precisión de {Math.round(exactitudM)} m.</Popup>
      </Marker>
    </>
  );
}
