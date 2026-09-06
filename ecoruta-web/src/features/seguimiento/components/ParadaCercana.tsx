import { estimarCaminataMinutos, formatearDistancia } from "@/domain/formato";
import type { ParadaConRutas } from "../types";

type Props = {
  parada: ParadaConRutas;
};

export function ParadaCercana({ parada }: Props) {
  const caminata = estimarCaminataMinutos(parada.distanciaM);

  return (
    <div className="flex items-center gap-4 rounded-[18px] border-[0.5px] border-borde bg-superficie-tinte p-4">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-full border-[0.5px] border-borde bg-white text-marca-profundo">
        <svg
          width="21"
          height="21"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <span className="font-serif text-[17px] font-bold leading-tight">
          {parada.nombre}
        </span>
        <span className="text-[13px] font-semibold text-tinta-suave">
          A {formatearDistancia(parada.distanciaM)} de ti · {caminata} min
          caminando
        </span>
      </div>
    </div>
  );
}
