"use client";

import { temaContrario, type Tema } from "@/domain/tema";
import { useTema } from "../hooks/useTema";

type Props = {
  temaInicial: Tema;
};

/**
 * Botón compacto para el menú del panel. Dice a qué tema lleva, no en cuál
 * está: «Tema oscuro» desde el claro y viceversa.
 */
export function BotonTema({ temaInicial }: Props) {
  const { tema, elegir } = useTema(temaInicial);
  const destino = temaContrario(tema);

  return (
    <button
      type="button"
      onClick={() => elegir(destino)}
      className="flex h-10 w-full items-center gap-3 rounded-[10px] px-2.5 text-sm font-semibold text-menu-texto transition-colors duration-200 ease-out hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sol"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {destino === "oscuro" ? (
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        ) : (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5" />
          </>
        )}
      </svg>
      {destino === "oscuro" ? "Tema oscuro" : "Tema claro"}
    </button>
  );
}
