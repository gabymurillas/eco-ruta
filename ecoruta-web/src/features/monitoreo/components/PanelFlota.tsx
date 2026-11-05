"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Destino } from "@/components/mapa/ControlesDeMapa";
import {
  evaluarSalud,
  pasaFiltroFlota,
  requiereRevision,
  type FiltroFlota,
} from "@/domain/flota";
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

const PESTANAS: { valor: FiltroFlota; texto: string }[] = [
  { valor: "todas", texto: "Todas" },
  { valor: "en_servicio", texto: "En servicio" },
  { valor: "con_alertas", texto: "Con alertas" },
];

/**
 * Mapa y lista de la flota conectados: elegir una tarjeta lleva el mapa a la
 * unidad y abre su ficha; tocar un marcador resalta su tarjeta y la trae a la
 * vista. Las pestañas filtran la lista, nunca el mapa: el gestor no pierde de
 * vista la flota completa mientras revisa un grupo.
 */
export function PanelFlota({ unidadesEnMapa, rutas, unidades, umbrales, encabezado }: Props) {
  const [elegidaId, setElegidaId] = useState<string | null>(null);
  const [destino, setDestino] = useState<Destino | null>(null);
  const [filtro, setFiltro] = useState<FiltroFlota>("todas");

  const clasificadas = useMemo(
    () =>
      unidades.map((unidad) => {
        const salud = evaluarSalud({
          vinculado: unidad.dispositivo_vinculado,
          enRecorrido: unidad.en_recorrido,
          segundosSinSenal: unidad.segundos_sin_senal,
          segundosSinLatido: unidad.segundos_sin_latido,
          umbralSinSenalS: umbrales.sinSenalS,
        });
        return { unidad, salud, conAlerta: requiereRevision(salud, unidad.bateria_pct, umbrales.bateriaPct) };
      }),
    [unidades, umbrales],
  );

  const conteo = (valor: FiltroFlota) =>
    clasificadas.filter(({ salud, conAlerta }) => pasaFiltroFlota(valor, salud, conAlerta)).length;
  const visibles = clasificadas.filter(({ salud, conAlerta }) => pasaFiltroFlota(filtro, salud, conAlerta));

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
    <div className="flex min-h-0 flex-1 gap-4">
      <div className="min-w-0 flex-1">
        <MapaFlota
          unidades={unidadesEnMapa}
          rutas={rutas}
          seleccion={{ unidadId: elegidaId, destino, alElegir: setElegidaId }}
        />
      </div>

      <aside className="flex w-[400px] shrink-0 flex-col overflow-hidden rounded-2xl border border-borde bg-superficie">
        {encabezado && <div className="flex flex-col gap-2.5 p-3.5 pb-1">{encabezado}</div>}

        <div role="group" aria-label="Filtrar la flota" className="flex gap-1 border-b border-borde px-3.5 py-2.5">
          {PESTANAS.map(({ valor, texto }) => (
            <button
              key={valor}
              type="button"
              aria-pressed={filtro === valor}
              onClick={() => setFiltro(valor)}
              className={`rounded-[9px] px-3 py-1.5 text-[13px] font-semibold transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo ${
                filtro === valor ? "bg-marca-profundo text-superficie" : "text-tinta-media hover:text-tinta"
              }`}
            >
              {texto} <span className="opacity-70">{conteo(valor)}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
          {unidades.length === 0 ? (
            <p className="p-3 text-sm text-tinta-media">Todavía no hay unidades registradas.</p>
          ) : visibles.length === 0 ? (
            <p className="p-3 text-sm text-tinta-media">
              {filtro === "con_alertas" ? "Ninguna unidad necesita revisión." : "Ninguna unidad está en servicio ahora."}
            </p>
          ) : (
            visibles.map(({ unidad }) => {
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
        </div>
      </aside>
    </div>
  );
}
