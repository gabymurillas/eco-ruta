"use client";

import { colorDeRuta } from "@/domain/colores";
import { formatearDistancia } from "@/domain/formato";
import type { Punto } from "@/domain/mapa";
import { etiquetaDePunto, longitudesDeTramos, type PuntoClave } from "@/domain/trazado";

type Props = {
  puntos: readonly PuntoClave[];
  linea: readonly Punto[];
  color: string | null;
};

const DECIMALES_COORDENADA = 4;

/** Cada punto con el tramo que llega a él y cómo se dibuja ese tramo. */
export function ListaPuntosClave({ puntos, linea, color }: Props) {
  const tramos = longitudesDeTramos(puntos, linea);

  return (
    <ol className="flex flex-col">
      {puntos.map((punto, indice) => (
        <li key={indice} className="flex items-center gap-2.5 border-b border-borde-suave py-2 text-[13.5px] font-semibold last:border-b-0">
          <span
            className={`grid h-6 min-w-[30px] place-items-center rounded-full border-2 bg-superficie px-1.5 text-[11px] font-extrabold ${punto.recto ? "border-dashed" : ""}`}
            style={{ borderColor: colorDeRuta(color) }}
          >
            {etiquetaDePunto(indice, puntos.length)}
          </span>
          <div className="flex min-w-0 flex-col">
            <span>Punto {indice + 1}</span>
            <small className="text-xs font-medium text-tinta-media">
              {indice === 0
                ? `${punto.lat.toFixed(DECIMALES_COORDENADA)}, ${punto.lng.toFixed(DECIMALES_COORDENADA)}`
                : `tramo de ${formatearDistancia(tramos[indice])}`}
            </small>
          </div>
          <span className="ml-auto rounded-full border border-borde bg-fondo px-2.5 py-0.5 text-xs font-bold whitespace-nowrap">
            {indice === 0 ? "Inicio" : punto.recto ? "Línea recta" : "Por las calles"}
          </span>
        </li>
      ))}
    </ol>
  );
}
