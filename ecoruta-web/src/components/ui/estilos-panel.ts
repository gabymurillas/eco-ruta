/**
 * Botones del panel de administración. Viven aparte de `Boton`, que es el de
 * la web del ciudadano (píldora de 48 px para el dedo): el panel se usa con
 * mouse y su identidad pide esquinas de 10 px y 40 px de alto.
 */
const BASE =
  "inline-flex h-10 items-center justify-center gap-2 rounded-[10px] px-4 text-sm font-semibold transition-[filter,background-color] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo disabled:cursor-not-allowed disabled:opacity-50";

export const BOTON_PANEL_PRINCIPAL = `${BASE} bg-marca-profundo text-superficie hover:brightness-110 disabled:hover:brightness-100`;

export const BOTON_PANEL_SECUNDARIO = `${BASE} border-[1.5px] border-borde-campo bg-superficie hover:bg-fondo disabled:hover:bg-superficie`;
