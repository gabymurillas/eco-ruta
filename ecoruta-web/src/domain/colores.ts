/**
 * Colores de ruta.
 *
 * `rutas.color` guarda un token, no un hex: así el admin elige de una paleta acotada
 * y la interfaz garantiza contraste y coherencia. Se acepta un hex explícito por
 * compatibilidad con datos ya cargados, y cualquier valor desconocido cae al color
 * de marca en vez de dejar el marcador invisible.
 */

const PALETA: Record<string, string> = {
  rojo: "#E94F37",
  naranja: "#F9844A",
  ambar: "#F9C74F",
};

const COLOR_POR_DEFECTO = PALETA.rojo;

export const TOKENS_DE_COLOR = Object.keys(PALETA);

export function colorDeRuta(token: string | null): string {
  if (!token) {
    return COLOR_POR_DEFECTO;
  }

  if (/^#[0-9a-f]{6}$/i.test(token)) {
    return token;
  }

  return PALETA[token.toLowerCase()] ?? COLOR_POR_DEFECTO;
}
