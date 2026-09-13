"use client";

import { Mapa } from "@/components/mapa/Mapa";
import { MarcadorUbicacion, MarcadorParada } from "@/components/mapa/CapasDeRuta";
import { MarcadorUnidad } from "@/components/mapa/MarcadorUnidad";
import { ZOOM_PARADA, type Punto } from "@/domain/mapa";

export type ParadaVisible = {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  color: string | null;
  destacada: boolean;
};

export type UnidadVisible = {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  rutaNombre: string;
  color: string | null;
  icono: string | null;
  transmitiendo: boolean;
};

type Props = {
  ubicacion: { lat: number; lng: number; exactitudM: number } | null;
  paradas: readonly ParadaVisible[];
  unidades: readonly UnidadVisible[];
};

/**
 * Mapa del ciudadano. Solo presentación.
 *
 * No dibuja geocercas: al ciudadano no le sirve ver el radio de disparo, y un círculo
 * punteado alrededor de su parada solo añadiría ruido. El geofencing se evalúa en el
 * servidor contra la unidad, no aquí.
 */
export function LienzoSeguimiento({ ubicacion, paradas, unidades }: Props) {
  const encuadrar: Punto[] = [
    ...(ubicacion ? [{ lat: ubicacion.lat, lng: ubicacion.lng }] : []),
    ...paradas.filter((parada) => parada.destacada).map(({ lat, lng }) => ({ lat, lng })),
    ...unidades.map(({ lat, lng }) => ({ lat, lng })),
  ];

  return (
    <Mapa encuadrar={encuadrar} zoom={ZOOM_PARADA} className="size-full">
      {paradas.map((parada) => (
        <MarcadorParada
          key={parada.id}
          lat={parada.lat}
          lng={parada.lng}
          nombre={parada.nombre}
          radioM={0}
          color={parada.color}
          destacada={parada.destacada}
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
        />
      ))}

      {ubicacion && (
        <MarcadorUbicacion
          lat={ubicacion.lat}
          lng={ubicacion.lng}
          exactitudM={ubicacion.exactitudM}
        />
      )}
    </Mapa>
  );
}
