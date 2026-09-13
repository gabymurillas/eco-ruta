"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import type { ReactNode } from "react";
import {
  calcularEncuadre,
  ZOOM_CIUDAD,
  type Punto,
} from "@/domain/mapa";

type Props = {
  /** Lo que debe quedar visible. Vacío centra en San Juan de los Morros. */
  encuadrar?: readonly Punto[];
  zoom?: number;
  className?: string;
  children?: ReactNode;
};

/**
 * Mapa base sobre teselas de OpenStreetMap.
 *
 * Leaflet en vez de Mapbox por tres razones del proyecto: no pide clave ni cuenta,
 * pesa ~42 KB contra ~230 KB —lo que importa en un teléfono de gama baja con datos
 * móviles— y dibuja círculos con radio en metros de forma nativa, que es exactamente
 * lo que necesitan las geocercas.
 *
 * El servidor público de teselas de OSM es para volumen bajo. Si el sistema se
 * despliega para toda la ciudad hay que apuntar a un proveedor con atribución
 * (Carto, por ejemplo) cambiando solo la URL de abajo.
 */
const TESELAS_OSM = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

const ATRIBUCION =
  '&copy; colaboradores de <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export function Mapa({ encuadrar = [], zoom = ZOOM_CIUDAD, className, children }: Props) {
  const encuadre = calcularEncuadre(encuadrar);

  return (
    <MapContainer
      center={[encuadre.centro.lat, encuadre.centro.lng]}
      zoom={zoom}
      scrollWheelZoom
      className={className}
      // Leaflet numera el zoom por niveles enteros; el fraccionado deja las teselas
      // borrosas en pantallas de baja densidad.
      zoomSnap={1}
    >
      <TileLayer url={TESELAS_OSM} attribution={ATRIBUCION} maxZoom={19} />
      <AjustarEncuadre puntos={encuadre.puntos} />
      {children}
    </MapContainer>
  );
}

/**
 * Encuadra el mapa sobre los puntos relevantes.
 *
 * Vive como componente hijo porque `useMap` solo funciona dentro del contenedor:
 * es la forma que da react-leaflet de alcanzar la instancia del mapa.
 */
function AjustarEncuadre({ puntos }: { puntos: readonly Punto[] }) {
  const mapa = useMap();

  // La clave depende de las coordenadas y no del arreglo: una lista nueva con los
  // mismos puntos (cada refresco de telemetría crea una) no debe mover el mapa
  // mientras el usuario lo está explorando.
  const clave = puntos.map((p) => `${p.lat},${p.lng}`).join("|");

  useEffect(() => {
    if (puntos.length < 2) {
      return;
    }

    mapa.fitBounds(
      puntos.map((punto) => [punto.lat, punto.lng]),
      { padding: [40, 40], maxZoom: 16 },
    );
    // `puntos` se omite a propósito: `clave` ya representa su contenido.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, mapa]);

  return null;
}
