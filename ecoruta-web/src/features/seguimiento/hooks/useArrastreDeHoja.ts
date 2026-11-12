"use client";

import {
  useRef,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
} from "react";

export type NivelHoja = "minima" | "baja" | "media" | "alta";

export const NIVELES: readonly NivelHoja[] = ["minima", "baja", "media", "alta"];

/**
 * Alto de cada nivel, relativo al espacio bajo la cabecera. La mínima deja solo
 * el asa y el nombre de la parada para ver el mapa casi entero; la baja muestra
 * la parada y la llegada más próxima; la alta deja una franja de mapa a la vista
 * para que se entienda que sigue ahí debajo.
 */
export const ALTOS: Record<NivelHoja, string> = {
  minima: "6.5rem",
  baja: "15.5rem",
  media: "min(33rem, 70%)",
  alta: "calc(100% - 0.75rem)",
};

/** Por debajo de esto, un toque en el asa es un toque y no un arrastre. */
const UMBRAL_ARRASTRE_PX = 6;
const ALTO_MINIMO_PX = 72;
const REM_PX = 16;
const ALTO_MINIMA_REM = 6.5;
const ALTO_BAJA_REM = 15.5;
const ALTO_MEDIA_REM = 33;
const FRACCION_MEDIA = 0.7;
const MARGEN_ALTA_PX = 12;

type Arrastre = { inicioY: number; altoInicial: number; movido: boolean };

type Entrada = {
  hoja: RefObject<HTMLElement | null>;
  nivel: NivelHoja;
  cambiarNivel: (nivel: NivelHoja) => void;
};

/**
 * Gestos del asa de la hoja: arrastrar la sube o la baja y al soltar se queda
 * en el nivel más cercano; tocarla pasa al siguiente nivel; con el teclado,
 * las flechas arriba y abajo hacen lo mismo.
 */
export function useArrastreDeHoja({ hoja, nivel, cambiarNivel }: Entrada) {
  const arrastre = useRef<Arrastre | null>(null);
  const ignorarClic = useRef(false);

  const onPointerDown = (evento: PointerEvent<HTMLButtonElement>) => {
    arrastre.current = {
      inicioY: evento.clientY,
      altoInicial: hoja.current?.getBoundingClientRect().height ?? 0,
      movido: false,
    };
    evento.currentTarget.setPointerCapture(evento.pointerId);
  };

  const onPointerMove = (evento: PointerEvent<HTMLButtonElement>) => {
    const actual = arrastre.current;

    if (!actual || !hoja.current) {
      return;
    }

    const delta = actual.inicioY - evento.clientY;
    actual.movido ||= Math.abs(delta) > UMBRAL_ARRASTRE_PX;

    if (actual.movido) {
      hoja.current.setAttribute("data-arrastrando", "true");
      hoja.current.style.setProperty(
        "--alto-hoja",
        `${Math.max(ALTO_MINIMO_PX, actual.altoInicial + delta)}px`,
      );
    }
  };

  const onPointerUp = () => {
    const actual = arrastre.current;
    arrastre.current = null;

    if (!actual?.movido || !hoja.current) {
      return;
    }

    hoja.current.removeAttribute("data-arrastrando");
    ignorarClic.current = true;
    cambiarNivel(nivelMasCercano(hoja.current));
  };

  const onClick = () => {
    if (ignorarClic.current) {
      ignorarClic.current = false;
      return;
    }

    cambiarNivel(NIVELES[(NIVELES.indexOf(nivel) + 1) % NIVELES.length]);
  };

  const onKeyDown = (evento: KeyboardEvent<HTMLButtonElement>) => {
    const paso = ({ ArrowUp: 1, ArrowDown: -1 } as Record<string, number>)[evento.key];

    if (paso === undefined) {
      return;
    }

    evento.preventDefault();
    const indice = Math.min(NIVELES.length - 1, Math.max(0, NIVELES.indexOf(nivel) + paso));
    cambiarNivel(NIVELES[indice]);
  };

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onClick, onKeyDown };
}

/** Al soltar, la hoja se queda en el nivel cuyo alto quedó más cerca. */
function nivelMasCercano(hoja: HTMLElement): NivelHoja {
  const disponible = hoja.parentElement?.clientHeight ?? window.innerHeight;
  const alto = hoja.getBoundingClientRect().height;
  const altos: Record<NivelHoja, number> = {
    minima: ALTO_MINIMA_REM * REM_PX,
    baja: ALTO_BAJA_REM * REM_PX,
    media: Math.min(ALTO_MEDIA_REM * REM_PX, disponible * FRACCION_MEDIA),
    alta: disponible - MARGEN_ALTA_PX,
  };

  return NIVELES.reduce((mejor, candidato) =>
    Math.abs(altos[candidato] - alto) < Math.abs(altos[mejor] - alto) ? candidato : mejor,
  );
}
