"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Destino } from "@/components/mapa/ControlesDeMapa";
import type { EstadoUnidad } from "@/services/flota.service";
import type { RutaEnMapa, UnidadEnMapa } from "./LienzoFlota";
import { MapaFlota } from "./MapaFlota";
import { idDeTarjeta, TarjetaUnidad } from "./TarjetaUnidad";

type Props = {
  unidadesEnMapa: readonly UnidadEnMapa[];
  rutas: readonly RutaEnMapa[];
  unidades: readonly EstadoUnidad[];
  umbrales: { sinSenalS: number; bateriaPct: number };
  /** Lo que va arriba de la lista de flota (las incidencias activas). */
  encabezado?: ReactNode;
};

/**
 * Mapa y lista de la flota conectados: elegir una tarjeta lleva el mapa a la
 * unidad y abre su ficha; tocar un marcador resalta su tarjeta y la trae a la
 * vista. Antes eran dos vistas sueltas y el gestor tenía que buscar a ojo qué
 * marcador correspondía a qué tarjeta.
 */
export function PanelFlota({ unidadesEnMapa, rutas, unidades, umbrales, encabezado }: Props) {
  const [elegidaId, setElegidaId] = useState<string | null>(null);
  const [destino, setDestino] = useState<Destino | null>(null);

  useEffect(() => {
    if (elegidaId) {
      document.getElementById(idDeTarjeta(elegidaId))?.scrollIntoView({ block: "nearest" });
    }
  }, [elegidaId]);

  // El destino se fija al elegir, con la posición de ese momento: si la unidad se
  // mueve después, el mapa no la persigue mientras el gestor lo explora.
  function verEnMapa(unidad: UnidadEnMapa) {
    setElegidaId(unidad.id);
    // El id cambia en cada elección para que el mapa vuelva aunque sea la misma unidad.
    setDestino((anterior) => ({ lat: unidad.lat, lng: unidad.lng, id: (anterior?.id ?? 0) + 1 }));
  }

  return (
    <div className="flex min-h-0 flex-1 gap-5">
      <MapaFlota
        unidades={unidadesEnMapa}
        rutas={rutas}
        seleccion={{ unidadId: elegidaId, destino, alElegir: setElegidaId }}
      />

      <aside className="flex w-86 shrink-0 flex-col gap-3 overflow-y-auto rounded-2xl border-[0.5px] border-borde bg-superficie p-5">
        {encabezado}

        <h2 className="text-xs font-bold tracking-wide text-tinta-suave">Flota</h2>

        {unidades.length === 0 ? (
          <p className="text-sm text-tinta-media">Todavía no hay unidades registradas.</p>
        ) : (
          unidades.map((unidad) => {
            const enMapa = unidadesEnMapa.find((u) => u.id === unidad.unidad_id);

            return (
              <TarjetaUnidad
                key={unidad.unidad_id}
                unidad={unidad}
                umbralSinSenalS={umbrales.sinSenalS}
                umbralBateriaPct={umbrales.bateriaPct}
                seleccionada={elegidaId === unidad.unidad_id}
                alVerEnMapa={enMapa ? () => verEnMapa(enMapa) : null}
              />
            );
          })
        )}
      </aside>
    </div>
  );
}
