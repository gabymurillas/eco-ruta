"use client";

import { Mapa } from "@/components/mapa/Mapa";
import { MarcadorParada, MarcadorUbicacion, TrazadoRuta } from "@/components/mapa/CapasDeRuta";
import { MarcadorUnidad } from "@/components/mapa/MarcadorUnidad";
import { ZOOM_PARADA, type Punto } from "@/domain/mapa";
import type { TrazadoVisible } from "../hooks/useTrazados";

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
  trazados: readonly TrazadoVisible[];
};

/** Lo que tapa la hoja en su altura baja (15,5 rem) más un respiro. */
const ALTO_HOJA_BAJA_PX = 264;
const ESCRITORIO = "(min-width: 1024px)";

/**
 * Mapa del ciudadano a pantalla completa. Solo presentación.
 *
 * No dibuja geocercas: al ciudadano no le sirve ver el radio de disparo, y un círculo
 * punteado alrededor de su parada solo añadiría ruido. El geofencing se evalúa en el
 * servidor contra la unidad, no aquí.
 *
 * En el teléfono la hoja tapa la parte de abajo: el encuadre la descuenta y el
 * crédito de OpenStreetMap sube a la esquina de arriba.
 */
export function LienzoSeguimiento({ ubicacion, paradas, unidades, trazados }: Props) {
  // Este componente solo se monta en el navegador (import dinámico sin SSR).
  const escritorio = window.matchMedia(ESCRITORIO).matches;
  const encuadrar: Punto[] = [
    ...(ubicacion ? [{ lat: ubicacion.lat, lng: ubicacion.lng }] : []),
    ...paradas.filter((parada) => parada.destacada).map(({ lat, lng }) => ({ lat, lng })),
    ...unidades.map(({ lat, lng }) => ({ lat, lng })),
  ];

  return (
    <Mapa
      encuadrar={encuadrar}
      zoom={ZOOM_PARADA}
      className="size-full"
      margenInferiorPx={escritorio ? 0 : ALTO_HOJA_BAJA_PX}
      atribucionArriba={!escritorio}
    >
      {trazados.map((trazado) => (
        <TrazadoRuta key={trazado.rutaId} puntos={trazado.puntos} color={trazado.color} />
      ))}

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
          adaptable
        />
      ))}

      {ubicacion && (
        <MarcadorUbicacion lat={ubicacion.lat} lng={ubicacion.lng} exactitudM={ubicacion.exactitudM} />
      )}
    </Mapa>
  );
}
