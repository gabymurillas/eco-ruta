"use client";

import { createContext, useContext, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ALTOS, useArrastreDeHoja, type NivelHoja } from "../hooks/useArrastreDeHoja";

type ContextoHoja = {
  nivel: NivelHoja;
  cambiarNivel: (nivel: NivelHoja) => void;
};

const Contexto = createContext<ContextoHoja>({
  nivel: "alta",
  cambiarNivel: () => {},
});

/** Para que el contenido pueda subir la hoja («Ver las 3 llegadas», «Cambiar»). */
export function useHoja(): ContextoHoja {
  return useContext(Contexto);
}

type Props = {
  nivelInicial: NivelHoja;
  etiqueta: string;
  children: ReactNode;
};

/**
 * Hoja inferior de tres alturas sobre el mapa (teléfono). Se arrastra desde el
 * asa; tocar el asa, o las flechas con el teclado, hace lo mismo para quien no
 * puede arrastrar. En escritorio es una columna fija a la derecha del mapa.
 *
 * Solo el asa arrastra: el contenido conserva su scroll normal.
 */
export function HojaInferior({ nivelInicial, etiqueta, children }: Props) {
  const [nivel, setNivel] = useState<NivelHoja>(nivelInicial);
  const hoja = useRef<HTMLElement>(null);

  const cambiarNivel = (nuevo: NivelHoja) => {
    // Tras un arrastre el estilo quedó en píxeles; React no lo repone si el
    // nivel no cambió, así que se fija aquí.
    hoja.current?.style.setProperty("--alto-hoja", ALTOS[nuevo]);
    setNivel(nuevo);
  };

  const gestos = useArrastreDeHoja({ hoja, nivel, cambiarNivel });

  return (
    <Contexto.Provider value={{ nivel, cambiarNivel }}>
      <section
        ref={hoja}
        aria-label={etiqueta}
        style={{ "--alto-hoja": ALTOS[nivel] } as CSSProperties}
        className="absolute inset-x-0 bottom-0 z-[1100] flex h-[var(--alto-hoja)] flex-col rounded-t-[20px] border-t border-borde bg-superficie transition-[height] duration-300 ease-out data-[arrastrando=true]:transition-none lg:static lg:h-full lg:w-[440px] lg:shrink-0 lg:rounded-none lg:border-t-0 lg:border-l"
      >
        <button
          type="button"
          aria-label={nivel === "alta" ? "Mostrar menos" : "Mostrar más"}
          {...gestos}
          className="flex h-7 w-full shrink-0 cursor-grab touch-none items-center justify-center rounded-t-[20px] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-marca-profundo lg:hidden"
        >
          <span aria-hidden="true" className="h-1 w-10 rounded-full bg-borde" />
        </button>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-5 pb-[calc(1.75rem+env(safe-area-inset-bottom))] lg:px-7 lg:pt-7">
          {children}
        </div>
      </section>
    </Contexto.Provider>
  );
}
