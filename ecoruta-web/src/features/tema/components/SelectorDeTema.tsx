"use client";

import type { Tema } from "@/domain/tema";
import { useTema } from "../hooks/useTema";

type Props = {
  temaInicial: Tema;
};

const OPCIONES: { valor: Tema; texto: string }[] = [
  { valor: "claro", texto: "Claro" },
  { valor: "oscuro", texto: "Oscuro" },
];

/**
 * Control segmentado Claro / Oscuro. Es un grupo de botones con `aria-pressed`
 * y no un interruptor: las dos opciones tienen nombre propio y se leen tal cual.
 */
export function SelectorDeTema({ temaInicial }: Props) {
  const { tema, elegir } = useTema(temaInicial);

  return (
    <div
      role="group"
      aria-label="Tema de la pantalla"
      className="flex rounded-full border border-borde bg-superficie p-1"
    >
      {OPCIONES.map(({ valor, texto }) => {
        const activo = tema === valor;

        return (
          <button
            key={valor}
            type="button"
            aria-pressed={activo}
            onClick={() => elegir(valor)}
            className={`flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo ${
              activo ? "bg-marca-profundo text-superficie" : "text-tinta-media hover:text-tinta"
            }`}
          >
            <IconoTema tema={valor} />
            {texto}
          </button>
        );
      })}
    </div>
  );
}

function IconoTema({ tema }: { tema: Tema }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {tema === "oscuro" ? (
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      ) : (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5" />
        </>
      )}
    </svg>
  );
}
