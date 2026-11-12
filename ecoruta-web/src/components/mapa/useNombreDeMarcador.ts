"use client";

import type { Marker as MarcadorLeaflet } from "leaflet";
import { useEffect, type RefObject } from "react";

/**
 * Leaflet dibuja un marcador de HTML como `div role="button"` enfocable, sin
 * nombre: el `alt` de react-leaflet solo sirve para íconos de imagen. Un lector
 * de pantalla decía solo «botón». Se pone en cada render porque Leaflet cambia
 * el elemento cuando cambia el ícono (selección, señal perdida).
 */
export function useNombreDeMarcador(referencia: RefObject<MarcadorLeaflet | null>, nombre: string) {
  useEffect(() => {
    referencia.current?.getElement()?.setAttribute("aria-label", nombre);
  });
}
