"use client";

import type { LeafletMouseEvent } from "leaflet";
import { useEffect } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import { ZOOM_PARADA, type Punto } from "@/domain/mapa";

/** Un destino con id: así el mapa vuela dos veces seguidas al mismo lugar. */
export type Destino = Punto & { id: number };

/**
 * Lleva el mapa a un punto elegido fuera de él (el buscador o una lista).
 * Viven como hijos del mapa porque `useMap` solo funciona dentro del contenedor.
 */
export function VolarA({ destino }: { destino: Destino | null }) {
  const mapa = useMap();

  useEffect(() => {
    if (!destino) {
      return;
    }

    const zoom = Math.max(mapa.getZoom(), ZOOM_PARADA);
    const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (sinMovimiento) {
      mapa.setView([destino.lat, destino.lng], zoom);
    } else {
      mapa.flyTo([destino.lat, destino.lng], zoom, { duration: 0.5 });
    }
  }, [destino, mapa]);

  return null;
}

export function CapturarClics({ onClic }: { onClic: (punto: Punto) => void }) {
  useMapEvents({
    click: (evento: LeafletMouseEvent) => {
      onClic({ lat: evento.latlng.lat, lng: evento.latlng.lng });
    },
  });

  return null;
}
