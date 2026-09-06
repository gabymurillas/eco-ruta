/**
 * Reglas de salud de la flota. Funciones puras: entran datos, salen datos.
 *
 * Los umbrales llegan como argumento porque viven en la tabla `parametros` y el ente
 * gestor los recalibra tras la prueba de campo. Codificarlos aquí obligaría a
 * recompilar para cambiar un número.
 */

export type SaludUnidad = "transmitiendo" | "sin_senal" | "detenida" | "sin_vincular";

export type EntradaSalud = {
  vinculado: boolean;
  enRecorrido: boolean;
  segundosSinSenal: number | null;
  umbralSinSenalS: number;
};

export function evaluarSalud({
  vinculado,
  enRecorrido,
  segundosSinSenal,
  umbralSinSenalS,
}: EntradaSalud): SaludUnidad {
  if (!vinculado) {
    return "sin_vincular";
  }

  if (!enRecorrido) {
    return "detenida";
  }

  // Sin lecturas todavía en un viaje abierto: se trata como pérdida de señal,
  // no como "todo bien". Un viaje sin telemetría no sirve para nada.
  if (segundosSinSenal === null || segundosSinSenal > umbralSinSenalS) {
    return "sin_senal";
  }

  return "transmitiendo";
}

export function bateriaEnAlerta(
  bateriaPct: number | null,
  umbralPct: number,
): boolean {
  return bateriaPct !== null && bateriaPct <= umbralPct;
}

/** "hace 4 s", "hace 12 min", "hace 2 h". Sin señal reciente devuelve null. */
export function describirUltimaSenal(segundos: number | null): string | null {
  if (segundos === null) {
    return null;
  }

  if (segundos < 60) {
    return `hace ${segundos} s`;
  }

  if (segundos < 3600) {
    return `hace ${Math.floor(segundos / 60)} min`;
  }

  return `hace ${Math.floor(segundos / 3600)} h`;
}
