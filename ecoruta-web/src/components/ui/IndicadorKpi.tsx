import type { ReactNode } from "react";

type Tono = "neutro" | "exito" | "advertencia";

type Props = {
  titulo: string;
  valor: string;
  detalle: ReactNode;
  /** Trazos SVG (24×24) del ícono. Sin ícono, el indicador queda solo con texto. */
  icono?: ReactNode;
  tono?: Tono;
};

/**
 * El tono solo pinta el ícono: la cifra y el texto van siempre en tinta. Un
 * indicador en alerta se distingue sin teñir la tarjeta entera, y el color nunca
 * es lo único que lo dice: el detalle nombra qué pasa.
 */
const COLOR_ICONO: Record<Tono, string> = {
  neutro: "text-tinta-media",
  exito: "text-exito",
  advertencia: "text-advertencia",
};

export function IndicadorKpi({ titulo, valor, detalle, icono, tono = "neutro" }: Props) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3.5 rounded-2xl border border-borde bg-superficie px-4 py-3.5">
      {icono && (
        <span
          className={`grid size-11 shrink-0 place-items-center rounded-xl bg-fondo ${COLOR_ICONO[tono]}`}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {icono}
          </svg>
        </span>
      )}
      <div className="flex min-w-0 flex-col">
        <span className="text-[26px] leading-none font-extrabold">{valor}</span>
        <span className="mt-1 text-[13px] font-semibold text-tinta-media">{titulo}</span>
        <span className="truncate text-xs text-tinta-suave">{detalle}</span>
      </div>
    </div>
  );
}
