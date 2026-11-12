"use client";

import { Mapa } from "@/components/mapa/Mapa";
import { CaminoAPie, MarcadorParada, MarcadorUbicacion, TrazadoRuta } from "@/components/mapa/CapasDeRuta";
import { MarcadorUnidad } from "@/components/mapa/MarcadorUnidad";
import { ZOOM_PARADA, type Punto } from "@/domain/mapa";
import type { TrazadoVisible } from "../hooks/useTrazados";
import { CamaraDelCiudadano, type Camara } from "./CamaraDelCiudadano";

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
  camara: Camara;
  /** La ruta que el ciudadano tocó: su trazado resalta y las demás se atenúan. */
  rutaSeguidaId: string | null;
  unidadSeguidaId: string | null;
  /** El camino a pie hasta la parada, si el ciudadano lo pidió. */
  caminata: readonly Punto[];
  alMoverAMano: () => void;
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
export function LienzoSeguimiento(props: Props) {
  const { ubicacion, paradas, unidades, trazados, camara, rutaSeguidaId } = props;
  // Este componente solo se monta en el navegador (import dinámico sin SSR).
  const escritorio = window.matchMedia(ESCRITORIO).matches;
  const margenInferiorPx = escritorio ? 0 : ALTO_HOJA_BAJA_PX;
  const unidadSeguida = unidades.find((unidad) => unidad.id === props.unidadSeguidaId) ?? null;
  const trazadoSeguido = trazados.find((trazado) => trazado.rutaId === rutaSeguidaId);

  // Solo en modo automático el mapa se re-encuadra solo; en los demás manda la cámara.
  const encuadrar: Punto[] = camara.modo !== "auto" ? [] : [
    ...(ubicacion ? [{ lat: ubicacion.lat, lng: ubicacion.lng }] : []),
    ...paradas.filter((parada) => parada.destacada).map(({ lat, lng }) => ({ lat, lng })),
    ...unidades.map(({ lat, lng }) => ({ lat, lng })),
  ];

  return (
    <Mapa
      encuadrar={encuadrar}
      zoom={ZOOM_PARADA}
      className="size-full"
      margenInferiorPx={margenInferiorPx}
      atribucionArriba={!escritorio}
    >
      <CamaraDelCiudadano
        camara={camara}
        ubicacion={ubicacion}
        unidad={unidadSeguida}
        trazado={trazadoSeguido?.puntos ?? []}
        caminata={props.caminata}
        margenInferiorPx={margenInferiorPx}
        alMoverAMano={props.alMoverAMano}
      />

      {/* La seguida se dibuja al final para quedar encima de las otras. */}
      {ordenarSeguidaAlFinal(trazados, rutaSeguidaId).map((trazado) => (
        <TrazadoRuta
          key={trazado.rutaId}
          puntos={trazado.puntos}
          color={trazado.color}
          secundario={rutaSeguidaId !== null && trazado.rutaId !== rutaSeguidaId}
        />
      ))}

      <CaminoAPie puntos={props.caminata} />

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

function ordenarSeguidaAlFinal(trazados: readonly TrazadoVisible[], rutaSeguidaId: string | null) {
  return [...trazados].sort(
    (a, b) => Number(a.rutaId === rutaSeguidaId) - Number(b.rutaId === rutaSeguidaId),
  );
}
