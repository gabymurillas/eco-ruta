"use client";

import { Mapa } from "@/components/mapa/Mapa";
import { MarcadorUnidad } from "@/components/mapa/MarcadorUnidad";
import { MarcadorParada, TrazadoRuta } from "@/components/mapa/CapasDeRuta";
import { describirUltimaSenal } from "@/domain/flota";
import { trazadoALatLng, type Punto } from "@/domain/mapa";

export type UnidadEnMapa = {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  rutaNombre: string | null;
  color: string | null;
  icono: string | null;
  transmitiendo: boolean;
  segundosSinSenal: number | null;
  velocidadKmh: number | null;
};

export type RutaEnMapa = {
  id: string;
  nombre: string;
  color: string | null;
  trazado: unknown;
};

export type ParadaEnMapa = {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  radioM: number;
  color: string | null;
};

type Props = {
  unidades: readonly UnidadEnMapa[];
  rutas: readonly RutaEnMapa[];
  paradas?: readonly ParadaEnMapa[];
  mostrarGeocercas?: boolean;
};

/**
 * Mapa de la flota. Solo presentación: recibe todo por props y no consulta nada.
 *
 * Se carga con `dynamic(..., { ssr: false })` desde su envoltorio porque Leaflet
 * necesita `window` al importarse y reventaría en el render del servidor.
 */
export function LienzoFlota({
  unidades,
  rutas,
  paradas = [],
  mostrarGeocercas = false,
}: Props) {
  const trazados = rutas.map((ruta) => ({
    ...ruta,
    puntos: trazadoALatLng(ruta.trazado),
  }));

  // El encuadre sale de lo que no se mueve. Con las unidades dentro, cada
  // posición nueva cambiaría el encuadre y el mapa saltaría cada pocos segundos
  // mientras el gestor lo explora. Solo sin rutas ni paradas se encuadra la flota.
  const fijos: Punto[] = [
    ...paradas.map(({ lat, lng }) => ({ lat, lng })),
    ...trazados.flatMap((ruta) => ruta.puntos),
  ];
  const encuadrar = fijos.length > 0 ? fijos : unidades.map(({ lat, lng }) => ({ lat, lng }));

  return (
    <Mapa encuadrar={encuadrar} className="size-full">
      {trazados.map((ruta) => (
        <TrazadoRuta key={ruta.id} puntos={ruta.puntos} color={ruta.color} />
      ))}

      {paradas.map((parada) => (
        <MarcadorParada
          key={parada.id}
          lat={parada.lat}
          lng={parada.lng}
          nombre={parada.nombre}
          radioM={parada.radioM}
          color={parada.color}
          mostrarGeocerca={mostrarGeocercas}
        />
      ))}

      {unidades.map((unidad) => (
        <MarcadorUnidad
          key={unidad.id}
          lat={unidad.lat}
          lng={unidad.lng}
          nombre={unidad.nombre}
          rutaNombre={unidad.rutaNombre}
          color={unidad.color}
          icono={unidad.icono}
          transmitiendo={unidad.transmitiendo}
          detalle={describirDetalle(unidad)}
        />
      ))}
    </Mapa>
  );
}

function describirDetalle(unidad: UnidadEnMapa): string {
  const senal = describirUltimaSenal(unidad.segundosSinSenal);

  if (!unidad.transmitiendo) {
    return senal ? `Última posición ${senal}` : "Sin señal";
  }

  const velocidad =
    unidad.velocidadKmh === null ? null : `${Math.round(unidad.velocidadKmh)} km/h`;

  return [velocidad, senal].filter(Boolean).join(" · ");
}
