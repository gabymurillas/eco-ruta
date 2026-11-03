"use client";

import { useState, type KeyboardEvent } from "react";
import type { Lugar } from "@/domain/lugares";
import { useBuscadorDeLugares, type EstadoBusqueda } from "../hooks/useBuscadorDeLugares";

type Props = {
  alElegir: (lugar: Lugar) => void;
};

const ID_LISTA = "buscador-lugares-resultados";

/** Buscador flotante sobre el mapa. Se maneja con flechas, Enter y Esc. */
export function BuscadorDeLugares({ alElegir }: Props) {
  const { texto, setTexto, busqueda, limpiar } = useBuscadorDeLugares();
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(0);

  const lugares = busqueda.estado === "listo" ? busqueda.lugares : [];
  const mostrarLista = abierto && busqueda.estado !== "inactivo";

  function elegir(lugar: Lugar) {
    alElegir(lugar);
    setAbierto(false);
  }

  function alTeclear(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key === "Escape") {
      setAbierto(false);
      return;
    }

    if (evento.key === "Enter" && lugares[activo]) {
      evento.preventDefault();
      elegir(lugares[activo]);
      return;
    }

    const paso = evento.key === "ArrowDown" ? 1 : evento.key === "ArrowUp" ? -1 : 0;

    if (paso !== 0 && lugares.length > 0) {
      evento.preventDefault();
      setAbierto(true);
      setActivo((actual) => (actual + paso + lugares.length) % lugares.length);
    }
  }

  return (
    <div className="relative w-full max-w-[380px]">
      <div className="flex h-12 items-center gap-2 rounded-full border-[0.5px] border-borde bg-superficie pl-4 pr-1.5 focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-marca-profundo">
        <IconoLupa />
        <input
          type="search"
          id="buscador-lugares"
          role="combobox"
          aria-label="Buscar un lugar o pegar coordenadas"
          aria-expanded={mostrarLista}
          aria-controls={ID_LISTA}
          aria-activedescendant={mostrarLista && lugares[activo] ? `lugar-${activo}` : undefined}
          autoComplete="off"
          placeholder="Buscar un lugar o pegar coordenadas"
          value={texto}
          onChange={(evento) => {
            setTexto(evento.target.value);
            setAbierto(true);
            setActivo(0);
          }}
          onFocus={() => setAbierto(true)}
          onBlur={() => setAbierto(false)}
          onKeyDown={alTeclear}
          className="h-full min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-tinta outline-none placeholder:font-normal placeholder:text-tinta-suave [&::-webkit-search-cancel-button]:hidden"
        />
        {texto && (
          <button
            type="button"
            onClick={limpiar}
            aria-label="Borrar la búsqueda"
            className="flex size-9 items-center justify-center rounded-full text-tinta-suave transition-colors duration-300 ease-out hover:bg-marca-tenue focus-visible:outline-2 focus-visible:outline-marca-profundo"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
      </div>

      {mostrarLista && (
        <ListaDeLugares
          busqueda={busqueda}
          activo={activo}
          alElegir={elegir}
        />
      )}
    </div>
  );
}

type PropsLista = {
  busqueda: EstadoBusqueda;
  activo: number;
  alElegir: (lugar: Lugar) => void;
};

function ListaDeLugares({ busqueda, activo, alElegir }: PropsLista) {
  return (
    <div className="absolute inset-x-0 top-14 overflow-hidden rounded-xl border-[0.5px] border-borde bg-superficie">
      {busqueda.estado === "buscando" && <Mensaje>Buscando…</Mensaje>}
      {busqueda.estado === "error" && <Mensaje error>{busqueda.mensaje}</Mensaje>}
      {busqueda.estado === "listo" && busqueda.lugares.length === 0 && (
        <Mensaje>
          No encontramos ese lugar. Prueba con otras palabras, o toca «Agregar parada» y
          márcala en el mapa.
        </Mensaje>
      )}

      <ul id={ID_LISTA} role="listbox" aria-label="Lugares encontrados">
        {busqueda.estado === "listo" &&
          busqueda.lugares.map((lugar, indice) => (
            <li
              key={lugar.id}
              id={`lugar-${indice}`}
              role="option"
              aria-selected={indice === activo}
              // mousedown y no click: el blur del campo cerraría la lista antes del click.
              onMouseDown={(evento) => {
                evento.preventDefault();
                alElegir(lugar);
              }}
              className={`flex cursor-pointer flex-col gap-px px-4 py-2.5 transition-colors duration-300 ease-out hover:bg-marca-tenue ${
                indice === activo ? "bg-marca-tenue" : ""
              }`}
            >
              <span className="text-sm font-bold">{lugar.nombre}</span>
              {lugar.detalle && (
                <span className="truncate text-xs text-tinta-media">{lugar.detalle}</span>
              )}
            </li>
          ))}
      </ul>
    </div>
  );
}

function Mensaje({ error = false, children }: { error?: boolean; children: string | string[] }) {
  return (
    <p
      role={error ? "alert" : "status"}
      className={`px-4 py-3 text-[13px] leading-relaxed ${error ? "font-semibold text-error" : "text-tinta-media"}`}
    >
      {children}
    </p>
  );
}

function IconoLupa() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" className="shrink-0 text-tinta-suave" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </svg>
  );
}
