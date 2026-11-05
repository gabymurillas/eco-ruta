/**
 * Íconos de marcador que la interfaz sabe dibujar.
 *
 * Es una lista cerrada aunque `rutas.tipo` sea texto libre: el sistema solo puede
 * mostrar los íconos que tiene dibujados. Un valor desconocido no rompe nada — cae al
 * marcador genérico — pero el admin debe elegir de aquí para que el resultado sea
 * predecible.
 *
 * Los trazos viven aquí y no dentro del componente porque se dibujan en dos sitios
 * distintos: como JSX en la interfaz y como cadena de texto dentro del marcador de
 * Leaflet. Duplicarlos garantizaría que un día dejen de coincidir.
 */

export const ICONOS_DISPONIBLES = [
  "bus",
  "camion",
  "cisterna",
  "van",
  "generico",
] as const;

export type IconoDisponible = (typeof ICONOS_DISPONIBLES)[number];

export const ICONO_POR_DEFECTO: IconoDisponible = "bus";

/** El valor guardado va sin tilde (`camion`); el gestor lee el nombre. */
const NOMBRES: Record<IconoDisponible, string> = {
  bus: "Bus",
  camion: "Camión",
  cisterna: "Cisterna",
  van: "Van",
  generico: "Genérico",
};

export function nombreDeIcono(icono: IconoDisponible): string {
  return NOMBRES[icono];
}

export type Forma =
  | { tipo: "path"; d: string }
  | { tipo: "rect"; x: number; y: number; ancho: number; alto: number; rx: number }
  | { tipo: "circle"; cx: number; cy: number; r: number };

const TRAZOS: Record<IconoDisponible, readonly Forma[]> = {
  bus: [
    { tipo: "rect", x: 4, y: 3, ancho: 16, alto: 13.5, rx: 3.4 },
    { tipo: "path", d: "M4 11h16" },
    { tipo: "path", d: "M8 16.5v2.4M16 16.5v2.4" },
  ],
  camion: [
    { tipo: "path", d: "M3 15.5V9h9v6.5" },
    { tipo: "path", d: "M12 11h3.6l2.8 3v1.5" },
    { tipo: "circle", cx: 7, cy: 17.5, r: 1.9 },
    { tipo: "circle", cx: 16, cy: 17.5, r: 1.9 },
  ],
  cisterna: [
    { tipo: "rect", x: 3, y: 8.5, ancho: 12, alto: 7, rx: 3.5 },
    { tipo: "path", d: "M15 11h2.6l2.8 3v1.5" },
    { tipo: "circle", cx: 7, cy: 17.5, r: 1.9 },
    { tipo: "circle", cx: 16, cy: 17.5, r: 1.9 },
  ],
  van: [
    { tipo: "path", d: "M3 15.5V9.5h10l4 3h4v3" },
    { tipo: "circle", cx: 7.5, cy: 17.5, r: 1.9 },
    { tipo: "circle", cx: 16.5, cy: 17.5, r: 1.9 },
  ],
  generico: [
    { tipo: "circle", cx: 12, cy: 12, r: 7.5 },
    { tipo: "circle", cx: 12, cy: 12, r: 2.5 },
  ],
};

export function formasDeIcono(icono: string | null): readonly Forma[] {
  if (icono && icono in TRAZOS) {
    return TRAZOS[icono as IconoDisponible];
  }

  return TRAZOS.generico;
}

/**
 * El mismo ícono como cadena de texto, para el marcador de Leaflet: `DivIcon` recibe
 * HTML crudo y no sabe renderizar JSX.
 */
export function svgDeIcono(icono: string | null, tamano: number): string {
  const formas = formasDeIcono(icono)
    .map((forma) => {
      if (forma.tipo === "path") {
        return `<path d="${forma.d}"/>`;
      }

      if (forma.tipo === "rect") {
        return `<rect x="${forma.x}" y="${forma.y}" width="${forma.ancho}" height="${forma.alto}" rx="${forma.rx}"/>`;
      }

      return `<circle cx="${forma.cx}" cy="${forma.cy}" r="${forma.r}"/>`;
    })
    .join("");

  return `<svg width="${tamano}" height="${tamano}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${formas}</svg>`;
}
