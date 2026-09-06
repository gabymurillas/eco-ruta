"use client";

import { useEffect, useState } from "react";
import { Boton } from "@/components/ui/Boton";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { segundosRestantes } from "@/domain/vinculacion";

type Props = {
  unidadNombre: string;
  codigo: string;
  expiraEn: string;
  regenerando: boolean;
};

const PASOS = [
  "Abre EcoRuta en el teléfono que vive dentro del vehículo.",
  "Escribe el código. Sirve una sola vez y el teléfono queda atado a esta unidad.",
  "Déjalo conectado al sistema eléctrico. El chofer no necesita cuenta.",
];

export function PanelVinculacion({
  unidadNombre,
  codigo,
  expiraEn,
  regenerando,
}: Props) {
  const restantes = useCuentaRegresiva(expiraEn);
  const vencido = restantes === 0;

  return (
    <Tarjeta className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-[17px] font-black tracking-tight">
          Vincular {unidadNombre}
        </h2>
        <p className="text-xs font-semibold text-tinta-suave">
          Escribe este código en el teléfono de la unidad
        </p>
      </div>

      <div
        className={`flex flex-col items-center gap-2.5 rounded-[14px] border-[0.5px] p-6 ${
          vencido ? "border-borde bg-fondo" : "border-borde bg-marca-tenue"
        }`}
      >
        <span
          className={`font-serif text-[38px] font-black tracking-[6px] ${
            vencido ? "text-tinta-suave line-through" : "text-marca-profundo"
          }`}
        >
          {codigo}
        </span>

        <p
          className={`text-[13px] font-bold ${vencido ? "text-error" : "text-advertencia-tinta"}`}
          role="status"
        >
          {vencido ? "Venció. Genera otro." : `Vence en ${formatearCuenta(restantes)}`}
        </p>
      </div>

      <ol className="flex flex-col gap-2.5">
        {PASOS.map((paso, indice) => (
          <li key={paso} className="flex items-start gap-2.5">
            <span
              aria-hidden="true"
              className="flex size-[22px] shrink-0 items-center justify-center rounded-full border-[0.5px] border-borde bg-fondo text-[11px] font-bold"
            >
              {indice + 1}
            </span>
            <span className="text-[13px] leading-relaxed text-tinta-media">{paso}</span>
          </li>
        ))}
      </ol>

      {/* Vive dentro del formulario de la tabla: enviar regenera el codigo. */}
      <Boton type="submit" variante="secundario" disabled={regenerando}>
        {regenerando ? "Generando…" : "Generar otro código"}
      </Boton>
    </Tarjeta>
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

function formatearCuenta(segundos: number): string {
  const minutos = Math.floor(segundos / 60);
  const resto = segundos % 60;

  return `${minutos} min ${String(resto).padStart(2, "0")} s`;
}
