import type { ReactNode } from "react";

type Props = {
  titulo: string;
  valor: string;
  detalle: ReactNode;
  tono?: "neutro" | "exito" | "advertencia";
};

const TONOS = {
  neutro: { caja: "border-borde bg-superficie", cifra: "text-tinta" },
  exito: { caja: "border-borde bg-superficie", cifra: "text-exito" },
  advertencia: {
    caja: "border-advertencia-borde bg-advertencia-fondo",
    cifra: "text-advertencia-tinta",
  },
} as const;

export function IndicadorKpi({ titulo, valor, detalle, tono = "neutro" }: Props) {
  const estilo = TONOS[tono];

  return (
    <div className={`flex flex-1 flex-col gap-1.5 rounded-xl border-[0.5px] p-4 ${estilo.caja}`}>
      <span className="text-xs font-bold tracking-wide text-tinta-suave">{titulo}</span>
      <div className="flex items-baseline gap-2">
        <span className={`font-serif text-3xl font-black leading-none ${estilo.cifra}`}>
          {valor}
        </span>
        <span className="text-[13px] font-semibold text-tinta-media">{detalle}</span>
      </div>
    </div>
  );
}
