"use client";

import { useEffect, useRef, useState } from "react";
import { BOTON_PANEL_PRINCIPAL, BOTON_PANEL_SECUNDARIO } from "@/components/ui/estilos-panel";
import { segundosRestantes, VIGENCIA_MINUTOS } from "@/domain/vinculacion";

type Props = {
  unidadNombre: string;
  vinculado: boolean;
  /** Null mientras no haya un código vigente: el panel ofrece generarlo. */
  codigo: { codigo: string; expiraEn: string } | null;
  generando: boolean;
};

const PASOS = [
  "Abre la app EcoRuta en el teléfono que va en la unidad.",
  "Toca «Vincular» y escribe el código. Sirve una sola vez.",
  "Cuando quede vinculado, la fila pasa a «Vinculado».",
];

const VIGENCIA_S = VIGENCIA_MINUTOS * 60;

/** Vive dentro del formulario de la tabla: su botón de envío genera el código. */
export function PanelVinculacion({ unidadNombre, vinculado, codigo, generando }: Props) {
  const titulo = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titulo.current?.focus();
  }, []);

  return (
    <section aria-labelledby="titulo-vinculacion" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2
          ref={titulo}
          id="titulo-vinculacion"
          tabIndex={-1}
          className="text-[19px] leading-tight font-extrabold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo"
        >
          Vincular el teléfono de {unidadNombre}
        </h2>
        <p className="text-[13px] leading-relaxed text-tinta-media">
          {codigo
            ? "Escribe este código en la app EcoRuta del teléfono que va en la unidad."
            : "Genera un código y escríbelo en la app EcoRuta del teléfono que va en la unidad."}
        </p>
      </div>

      {codigo ? (
        <CodigoVigente codigo={codigo.codigo} expiraEn={codigo.expiraEn} />
      ) : (
        vinculado && (
          <Aviso>
            Esta unidad ya tiene un teléfono vinculado. Generar un código sirve para pasar la
            unidad a otro teléfono, pero el actual conserva su acceso: para cortarlo hoy hay que
            eliminar la unidad.
          </Aviso>
        )
      )}

      <ol className="flex flex-col gap-2.5">
        {PASOS.map((paso, indice) => (
          <li key={paso} className="flex items-start gap-2.5 text-[13.5px] leading-snug">
            <span
              aria-hidden="true"
              className="grid size-6 shrink-0 place-items-center rounded-full bg-marca-profundo text-xs font-bold text-superficie"
            >
              {indice + 1}
            </span>
            {paso}
          </li>
        ))}
      </ol>

      <Aviso>El teléfono queda atado a la unidad, no al chofer: nadie necesita cuenta.</Aviso>

      <button
        type="submit"
        disabled={generando}
        className={codigo ? BOTON_PANEL_SECUNDARIO : BOTON_PANEL_PRINCIPAL}
      >
        {generando ? "Generando…" : codigo ? "Generar otro código" : "Generar código"}
      </button>
    </section>
  );
}

function CodigoVigente({ codigo, expiraEn }: { codigo: string; expiraEn: string }) {
  const restantes = useCuentaRegresiva(expiraEn);
  const vencido = restantes === 0;

  return (
    <>
      <div
        className={`rounded-[14px] border-2 border-dashed border-borde-campo bg-fondo p-4 text-center text-[44px] font-extrabold tracking-[0.12em] ${
          vencido ? "text-tinta-suave line-through" : ""
        }`}
      >
        {codigo}
      </div>

      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="h-1.5 flex-1 overflow-hidden rounded-full bg-borde">
          <span
            className="block h-full bg-marca-profundo"
            style={{ width: `${Math.min(100, (restantes / VIGENCIA_S) * 100)}%` }}
          />
        </span>
        <span
          role="status"
          className={`text-[13px] font-bold ${vencido ? "text-error" : "text-tinta-media"}`}
        >
          {vencido ? "Venció. Genera otro." : `Vence en ${formatearCuenta(restantes)}`}
        </span>
      </div>
    </>
  );
}

function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-[10px] border border-borde bg-fondo p-3 text-[13px] leading-relaxed text-tinta-media">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="mt-0.5 shrink-0 text-marca" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8v.1" />
      </svg>
      <span>{children}</span>
    </p>
  );
}

/**
 * Cuenta regresiva en segundos. Se detiene sola al vencer.
 *
 * El estado que avanza es el reloj, no el resultado: los segundos restantes se derivan
 * de `expiraEn` y del instante actual. Así un código nuevo se refleja solo, sin tener
 * que resincronizar el estado desde un efecto.
 */
function useCuentaRegresiva(expiraEn: string): number {
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    const intervalo = setInterval(() => {
      const instante = Date.now();
      setAhora(instante);

      if (instante >= new Date(expiraEn).getTime()) {
        clearInterval(intervalo);
      }
    }, 1000);

    return () => clearInterval(intervalo);
  }, [expiraEn]);

  return segundosRestantes(expiraEn, new Date(ahora));
}

/** «8:42»: minutos y segundos, como un temporizador. */
function formatearCuenta(segundos: number): string {
  const minutos = Math.floor(segundos / 60);
  const resto = segundos % 60;

  return `${minutos}:${String(resto).padStart(2, "0")}`;
}
