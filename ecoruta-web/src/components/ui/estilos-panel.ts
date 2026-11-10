/**
 * Botones del panel de administración. Viven aparte de `Boton`, que es el de
 * la web del ciudadano (píldora de 48 px para el dedo): el panel se usa con
 * mouse y su identidad pide esquinas de 10 px y 40 px de alto.
 */
const BASE =
  "inline-flex h-10 items-center justify-center gap-2 rounded-[10px] px-4 text-sm font-semibold transition-[filter,background-color] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo disabled:cursor-not-allowed disabled:opacity-50";

export const BOTON_PANEL_PRINCIPAL = `${BASE} bg-marca-profundo text-superficie hover:brightness-110 disabled:hover:brightness-100`;

export const BOTON_PANEL_SECUNDARIO = `${BASE} border-[1.5px] border-borde-campo bg-superficie hover:bg-fondo disabled:hover:bg-superficie`;

export const BOTON_PANEL_PELIGRO = `${BASE} bg-error text-superficie hover:brightness-110 focus-visible:outline-error disabled:hover:brightness-100`;

const BASE_FILA =
  "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-borde-campo bg-superficie text-[13px] font-semibold transition-colors duration-200 ease-out hover:bg-fondo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo disabled:cursor-not-allowed disabled:opacity-50";

/** Botón de fila de tabla: más bajo, para que la fila no crezca. */
export const BOTON_FILA = `${BASE_FILA} px-2.5`;

/** Igual, pero cuadrado y solo con ícono: lleva `aria-label`. */
export const BOTON_FILA_ICONO = `${BASE_FILA} w-8`;
