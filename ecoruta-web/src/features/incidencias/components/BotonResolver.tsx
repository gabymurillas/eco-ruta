"use client";

import { useState, useTransition } from "react";
import { marcarResuelta } from "../acciones";

/**
 * No pide confirmación: resolver no borra nada y es lo que el gestor viene a
 * hacer. Si se equivoca, el conductor puede volver a reportarla.
 */
export function BotonResolver({ incidenciaId }: { incidenciaId: string }) {
  const [enviando, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={enviando}
        onClick={() =>
          iniciar(async () => {
            setError(null);
            const resultado = await marcarResuelta(incidenciaId);
            if (resultado.error) {
              setError(resultado.error);
            }
          })
        }
        className="flex h-10 items-center gap-2 rounded-[10px] bg-marca-profundo px-4 text-sm font-semibold text-superficie transition-[filter] duration-200 ease-out hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo disabled:opacity-60"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
        {enviando ? "Marcando…" : "Marcar resuelta"}
      </button>
      {error && (
        <p role="alert" className="text-[13px] font-semibold text-error">
          {error}
        </p>
      )}
    </div>
  );
}
