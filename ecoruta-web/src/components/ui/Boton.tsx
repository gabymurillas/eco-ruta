import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variante = "primario" | "secundario" | "fantasma";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante;
  children: ReactNode;
};

/**
 * El primario usa `marca-profundo` y no `marca`: el terracota de identidad con texto
 * blanco da 3,4:1 y no cumple AA (ver CLAUDE.md → sistema de diseño).
 */
const ESTILOS: Record<Variante, string> = {
  primario: "bg-marca-profundo text-superficie hover:brightness-110",
  secundario:
    "border-[0.5px] border-borde bg-superficie text-tinta hover:bg-marca-tenue",
  fantasma: "text-marca-profundo hover:bg-marca-tenue",
};

export function Boton({ variante = "primario", className = "", children, ...props }: Props) {
  return (
    <button
      className={`inline-flex h-12 min-w-12 items-center justify-center gap-2 rounded-full px-5 text-[15px] font-bold transition-[filter,background-color] duration-300 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo disabled:opacity-50 ${ESTILOS[variante]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
