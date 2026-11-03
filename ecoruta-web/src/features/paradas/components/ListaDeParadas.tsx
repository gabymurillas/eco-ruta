"use client";

import { useState } from "react";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { colorDeRuta } from "@/domain/colores";
import type { useEditorDeParadas } from "../hooks/useEditorDeParadas";

type Editor = ReturnType<typeof useEditorDeParadas>;

/** El catálogo, con un filtro: en una ciudad hay decenas de paradas. */
export function ListaDeParadas({ editor }: { editor: Editor }) {
  const [filtro, setFiltro] = useState("");
  const texto = filtro.trim().toLowerCase();
  const visibles = editor.paradas.filter((parada) => parada.nombre.toLowerCase().includes(texto));
  const sinRuta = editor.paradas.filter((parada) => parada.rutas.length === 0).length;

  return (
    <Tarjeta className="flex min-h-0 flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-[15px] font-bold">Paradas de la ciudad</h2>
        <span className="text-[13px] font-semibold text-tinta-media">{editor.paradas.length}</span>
      </div>

      {sinRuta > 0 && (
        <p className="text-xs leading-relaxed text-tinta-media">
          {sinRuta === 1 ? "1 parada no tiene" : `${sinRuta} paradas no tienen`} ninguna ruta que
          pase cerca. Se ven huecas en el mapa.
        </p>
      )}

      {editor.paradas.length === 0 ? (
        <p className="text-xs leading-relaxed text-tinta-media">
          Todavía no hay paradas. Busca un lugar o toca «Agregar parada» para colocar la primera.
        </p>
      ) : (
        <>
          <label htmlFor="filtro-paradas" className="sr-only">
            Filtrar paradas por nombre
          </label>
          <input
            id="filtro-paradas"
            type="search"
            value={filtro}
            onChange={(evento) => setFiltro(evento.target.value)}
            placeholder="Filtrar por nombre"
            className="h-10 rounded-[10px] border-[0.5px] border-borde bg-superficie px-3 text-sm font-semibold placeholder:font-normal placeholder:text-tinta-suave focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-marca-profundo"
          />

          <ul className="flex flex-col overflow-y-auto">
            {visibles.map((parada) => (
              <li key={parada.id}>
                <button
                  type="button"
                  onClick={() => editor.seleccionarParada(parada.id)}
                  className="flex w-full flex-col gap-1 rounded-lg px-2 py-2 text-left transition-colors duration-300 ease-out hover:bg-marca-tenue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo"
                >
                  <span className="truncate text-[13px] font-semibold">{parada.nombre}</span>
                  <span className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-tinta-media">
                    {parada.rutas.length === 0
                      ? "Sin rutas"
                      : parada.rutas.map((ruta) => (
                          <span key={ruta.id} className="flex items-center gap-1">
                            <span
                              aria-hidden="true"
                              className="size-1.5 rounded-full"
                              style={{ backgroundColor: colorDeRuta(ruta.color) }}
                            />
                            {ruta.nombre}
                          </span>
                        ))}
                  </span>
                </button>
              </li>
            ))}
            {visibles.length === 0 && (
              <li className="px-2 py-2 text-xs text-tinta-media">Ninguna parada se llama así.</li>
            )}
          </ul>
        </>
      )}
    </Tarjeta>
  );
}
