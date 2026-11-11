"use client";

import { useState } from "react";
import { colorDeRuta } from "@/domain/colores";
import type { useEditorDeParadas } from "../hooks/useEditorDeParadas";

type Editor = ReturnType<typeof useEditorDeParadas>;

/** El catálogo, con un filtro: en una ciudad hay decenas de paradas. */
export function ListaDeParadas({ editor, soloLectura }: { editor: Editor; soloLectura: boolean }) {
  const [filtro, setFiltro] = useState("");
  const texto = filtro.trim().toLowerCase();
  const visibles = editor.paradas.filter((parada) => parada.nombre.toLowerCase().includes(texto));
  const elegida = editor.ficha?.paradaId;

  return (
    <aside aria-label="Paradas de la ciudad" className="flex w-[300px] shrink-0 flex-col gap-2.5 overflow-hidden rounded-2xl border border-borde bg-superficie p-3.5">
      {editor.paradas.length === 0 ? (
        <p className="p-1 text-[13px] text-tinta-media">
          {soloLectura
            ? "Todavía no hay paradas. Las coloca un administrador."
            : "Todavía no hay paradas. Busca un lugar o toca «Nueva parada» para colocar la primera."}
        </p>
      ) : (
        <>
          <label htmlFor="filtro-paradas" className="sr-only">Filtrar paradas por nombre</label>
          <input
            id="filtro-paradas"
            type="search"
            value={filtro}
            onChange={(evento) => setFiltro(evento.target.value)}
            placeholder="Filtrar paradas"
            className="h-10 shrink-0 rounded-[10px] border-[1.5px] border-borde-campo bg-superficie px-3 text-sm font-semibold placeholder:font-normal placeholder:text-tinta-media focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-marca-profundo"
          />

          <ul className="flex min-h-0 flex-col gap-0.5 overflow-y-auto">
            {visibles.map((parada) => {
              const activa = parada.id === elegida;
              return (
                <li key={parada.id}>
                  <button
                    type="button"
                    onClick={() => editor.seleccionarParada(parada.id)}
                    aria-current={activa ? "true" : undefined}
                    className={`flex w-full items-center justify-between gap-3 rounded-[10px] p-2.5 text-left transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-marca-profundo ${
                      activa ? "bg-marca-tenue outline-2 outline-marca-profundo" : "hover:bg-fondo"
                    }`}
                  >
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="truncate text-sm font-bold">{parada.nombre}</span>
                      <RutasDeLaParada rutas={parada.rutas} />
                    </span>
                    <span className="flex shrink-0 flex-col items-end text-xs font-semibold text-tinta-media">
                      {parada.radioM} m
                      {!parada.notifica && <span className="font-medium">sin avisos</span>}
                    </span>
                  </button>
                </li>
              );
            })}
            {visibles.length === 0 && (
              <li className="p-2.5 text-[13px] text-tinta-media">Ninguna parada se llama así.</li>
            )}
          </ul>
        </>
      )}
    </aside>
  );
}

/** Una barrita por ruta, con su nombre para el lector de pantalla y al pasar el mouse. */
function RutasDeLaParada({ rutas }: { rutas: Editor["paradas"][number]["rutas"] }) {
  if (rutas.length === 0) {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-tinta-media">
        <svg width="10" height="10" viewBox="0 0 24 24" className="text-advertencia" aria-hidden="true">
          <path d="M12 2L23 21H1z" fill="currentColor" />
        </svg>
        Ninguna ruta pasa todavía
      </span>
    );
  }

  return (
    <span className="flex flex-wrap gap-1">
      <span className="sr-only">Pasan: {rutas.map((ruta) => ruta.nombre).join(", ")}</span>
      {rutas.map((ruta) => (
        <i
          key={ruta.id}
          aria-hidden="true"
          title={ruta.nombre}
          className="h-[5px] w-4 rounded-[3px]"
          style={{ backgroundColor: colorDeRuta(ruta.color) }}
        />
      ))}
    </span>
  );
}
