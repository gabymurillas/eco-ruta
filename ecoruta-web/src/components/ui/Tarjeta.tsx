import type { ReactNode } from "react";

type Tono = "neutro" | "marca" | "advertencia" | "error";

type Props = {
  tono?: Tono;
  className?: string;
  children: ReactNode;
};

const TONOS: Record<Tono, string> = {
  neutro: "border-borde bg-superficie",
  marca: "border-borde bg-marca-tenue",
  advertencia: "border-advertencia-borde bg-advertencia-fondo",
  error: "border-error bg-superficie",
};

/** Superficie plana: el borde de 0.5px define el contorno, nunca una sombra. */
export function Tarjeta({ tono = "neutro", className = "", children }: Props) {
  return (
    <div className={`rounded-xl border-[0.5px] p-4 ${TONOS[tono]} ${className}`}>
      {children}
    </div>
  );
}
