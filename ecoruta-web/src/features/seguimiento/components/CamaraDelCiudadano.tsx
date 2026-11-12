"use client";

import type { Map as MapaLeaflet } from "leaflet";
import { useEffect, useRef } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import { ZOOM_PARADA, type Punto } from "@/domain/mapa";

/**
 * Quién manda la cámara:
 * - `auto`: encuadra la parada, la ubicación y las unidades (lo de siempre).
 * - `libre`: el ciudadano movió el mapa con el dedo; nada lo vuelve a mover solo.
 * - `ubicacion`: centrada en el ciudadano, y lo acompaña si camina.
 * - `ruta`: acompaña a la unidad que sigue (o muestra el trazado si no hay unidad).
 */
export type ModoCamara = "auto" | "libre" | "ubicacion" | "ruta";

export type Camara = {
  modo: ModoCamara;
  /** Sube con cada toque de botón: volver a tocar re-centra aunque el modo sea el mismo. */
  vez: number;
};

type Props = {
  camara: Camara;
  ubicacion: Punto | null;
  unidad: Punto | null;
  trazado: readonly Punto[];
  /** Lo que tapa la hoja abajo: el punto que se sigue queda centrado en lo visible. */
  margenInferiorPx: number;
  alMoverAMano: () => void;
};

const MARGEN_PX = 40;
const DURACION_VUELO_S = 0.6;
const DURACION_PANEO_S = 1;

/** Mueve la cámara según el modo. Vive dentro del mapa porque `useMap` lo exige. */
export function CamaraDelCiudadano({
  camara,
  ubicacion,
  unidad,
  trazado,
  margenInferiorPx,
  alMoverAMano,
}: Props) {
  const mapa = useMap();

  // Solo un arrastre con el dedo o el ratón: los movimientos que hace el código
  // no disparan `dragstart`, así que no se confunden con el ciudadano.
  // Mientras vuela no se le da otra orden: un paneo a mitad del vuelo lo corta
  // y deja la cámara en un zoom intermedio, lejos de lo que se sigue.
  const volando = useRef(false);
  useMapEvents({
    dragstart: alMoverAMano,
    moveend: () => {
      volando.current = false;
    },
  });

  // Los datos más recientes, para que el efecto de abajo dependa solo del toque.
  const actual = useRef({ ubicacion, unidad, trazado, margenInferiorPx });
  useEffect(() => {
    actual.current = { ubicacion, unidad, trazado, margenInferiorPx };
  });

  // Al entrar a un modo (o volver a tocar su botón): un vuelo.
  useEffect(() => {
    const { ubicacion, unidad, trazado, margenInferiorPx } = actual.current;

    if (camara.modo === "ubicacion" && ubicacion) {
      volando.current = ir(mapa, ubicacion, margenInferiorPx, "vuelo");
    }

    if (camara.modo === "ruta") {
      if (unidad) {
        volando.current = ir(mapa, unidad, margenInferiorPx, "vuelo");
      } else if (trazado.length > 1) {
        mapa.flyToBounds(
          trazado.map(({ lat, lng }) => [lat, lng]),
          {
            paddingTopLeft: [MARGEN_PX, MARGEN_PX],
            paddingBottomRight: [MARGEN_PX, MARGEN_PX + margenInferiorPx],
            maxZoom: ZOOM_PARADA,
            duration: DURACION_VUELO_S,
            animate: !sinMovimiento(),
          },
        );
      }
    }
  }, [camara.modo, camara.vez, mapa]);

  // Después, acompaña al punto seguido cada vez que se mueve, sin cambiar el zoom.
  const seguido = camara.modo === "ruta" ? unidad : camara.modo === "ubicacion" ? ubicacion : null;
  const claveSeguido = seguido ? `${seguido.lat},${seguido.lng}` : "";

  useEffect(() => {
    if (seguido && !volando.current) {
      ir(mapa, seguido, actual.current.margenInferiorPx, "paneo");
    }
    // `seguido` es un objeto nuevo en cada refresco: `claveSeguido` es su contenido.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveSeguido, mapa]);

  return null;
}

/**
 * Centra el punto en la parte del mapa que no tapa la hoja. Con «reducir
 * movimiento» salta sin animar. Devuelve si quedó un vuelo en curso.
 */
function ir(
  mapa: MapaLeaflet,
  punto: Punto,
  margenInferiorPx: number,
  forma: "vuelo" | "paneo",
): boolean {
  const zoom = forma === "vuelo" ? Math.max(mapa.getZoom(), ZOOM_PARADA) : mapa.getZoom();
  const centro = mapa.unproject(
    mapa.project([punto.lat, punto.lng], zoom).add([0, margenInferiorPx / 2]),
    zoom,
  );
  const animar = !sinMovimiento();

  if (forma === "vuelo" && animar) {
    mapa.flyTo(centro, zoom, { duration: DURACION_VUELO_S });
    return true;
  }

  if (forma === "vuelo") {
    mapa.setView(centro, zoom, { animate: false });
  } else {
    mapa.panTo(centro, { animate: animar, duration: DURACION_PANEO_S });
  }

  return false;
}

function sinMovimiento(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
