/**
 * Colores de ruta.
 *
 * `rutas.color` guarda un token, no un hex: así el admin elige de una paleta acotada
 * y la interfaz garantiza que los cinco tonos se distingan entre sí. Se acepta un hex
 * explícito por compatibilidad con datos ya cargados, y cualquier valor desconocido cae
 * a un tono neutro en vez de dejar el marcador invisible.
 *
 * Los cinco se diferencian por TONO, no por saturación: el color identifica la ruta en el
 * mapa, y cinco variantes del mismo naranja hacen esa tarea imposible con daltonismo
 * rojo-verde. Ninguno cae en el rango del terracota de marca ni del rojo de error.
 */

const PALETA: Record<string, string> = {
  teal: "oklch(52% 0.11 195)",
  mostaza: "oklch(70% 0.14 75)",
  ciruela: "oklch(48% 0.13 340)",
  oliva: "oklch(50% 0.10 145)",
  indigo: "oklch(48% 0.12 265)",
};

/**
 * Mostaza es el único tono claro: un ícono blanco encima da 2,3:1 y no alcanza el mínimo
 * de 3:1 para elementos no textuales. Ese marcador lleva el glifo en tinta oscura.
 */
const TOKENS_CON_GLIFO_OSCURO = new Set(["mostaza"]);

const COLOR_POR_DEFECTO = PALETA.teal;
const TINTA_OSCURA = "oklch(25% 0.02 60)";
const TINTA_CLARA = "#FFFFFF";

export const TOKENS_DE_COLOR = Object.keys(PALETA);

export function colorDeRuta(token: string | null): string {
  if (!token) {
    return COLOR_POR_DEFECTO;
  }

  if (token.startsWith("#") || token.startsWith("oklch(")) {
    return token;
  }

  return PALETA[token.toLowerCase()] ?? COLOR_POR_DEFECTO;
}

/** Color del ícono que va dentro del marcador, para que siempre contraste con su relleno. */
export function tintaSobreColorDeRuta(token: string | null): string {
  return token && TOKENS_CON_GLIFO_OSCURO.has(token.toLowerCase())
    ? TINTA_OSCURA
    : TINTA_CLARA;
}
