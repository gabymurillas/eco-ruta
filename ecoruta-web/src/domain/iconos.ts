/**
 * Íconos de marcador que la interfaz sabe dibujar.
 *
 * Es una lista cerrada aunque `rutas.tipo` sea texto libre: el sistema solo puede
 * mostrar los íconos que tiene dibujados. Un valor desconocido no rompe nada — cae al
 * marcador genérico — pero el admin debe elegir de aquí para que el resultado sea
 * predecible.
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
