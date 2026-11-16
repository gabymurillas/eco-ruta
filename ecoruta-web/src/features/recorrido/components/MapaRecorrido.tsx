"use client";

import { Mapa } from "@/components/mapa/Mapa";
import { MarcadorParada, TrazadoRuta } from "@/components/mapa/CapasDeRuta";
import { MarcadorUnidad } from "@/components/mapa/MarcadorUnidad";
import type { Punto } from "@/domain/mapa";
import type { ParadaDelRecorrido, UnidadDelRecorrido } from "@/domain/recorrido";
import type { RutaDelDetalle } from "./DetalleRuta";

type Props = {
  ruta: RutaDelDetalle;
  trazado: readonly Punto[];
  paradas: readonly ParadaDelRecorrido[];
  unidades: readonly UnidadDelRecorrido[];
  miParadaId: string | null;
};

/**
 * El trazado con su color, las paradas y las unidades en recorrido. Solo
 * presentación.
 *
 * El encuadre es el trazado (o las paradas, si aún no llega) y no las unidades:
 * así el mapa no salta en cada refresco mientras el ciudadano lo mueve.
 */
export function MapaRecorrido({ ruta, trazado, paradas, unidades, miParadaId }: Props) {
  const encuadrar = trazado.length > 0 ? trazado : paradas.map(({ lat, lng }) => ({ lat, lng }));

  return (
    <Mapa encuadrar={encuadrar} className="size-full">
      <TrazadoRuta puntos={trazado} color={ruta.color} />

      {paradas.map((parada) => (
        <MarcadorParada
          key={parada.paradaId}
          lat={parada.lat}
          lng={parada.lng}
          nombre={parada.paradaId === miParadaId ? `${parada.nombre} (tu parada)` : parada.nombre}
          radioM={0}
          color={ruta.color}
          destacada={parada.paradaId === miParadaId}
        />
      ))}

      {unidades.map((unidad) => (
        <MarcadorUnidad
          key={unidad.unidadId}
          lat={unidad.lat}
          lng={unidad.lng}
          nombre={unidad.nombre}
          rutaNombre={ruta.nombre}
          color={ruta.color}
          icono={ruta.icono}
          transmitiendo={unidad.estado.tipo === "en_camino"}
          detalle={unidad.estado.tipo === "en_camino" ? undefined : "Sin señal: última posición conocida"}
          adaptable
        />
      ))}
    </Mapa>
  );
}
