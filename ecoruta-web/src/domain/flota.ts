/**
 * Reglas de salud de la flota. Funciones puras: entran datos, salen datos.
 *
 * Los umbrales llegan como argumento porque viven en la tabla `parametros` y el ente
 * gestor los recalibra tras la prueba de campo. Codificarlos aquí obligaría a
 * recompilar para cambiar un número.
 */

export type SaludUnidad =
  | "transmitiendo"
  | "sin_senal"
  | "detenida"
  | "equipo_caido"
  | "sin_vincular";

export type EntradaSalud = {
  vinculado: boolean;
  enRecorrido: boolean;
  /** Desde la última posición. Dice si el marcador del mapa está fresco. */
  segundosSinSenal: number | null;
  /** Desde el último reporte del equipo. Dice si el teléfono sigue vivo. */
  segundosSinLatido: number | null;
  umbralSinSenalS: number;
};

export function evaluarSalud({
  vinculado,
  enRecorrido,
  segundosSinSenal,
  segundosSinLatido,
  umbralSinSenalS,
}: EntradaSalud): SaludUnidad {
  if (!vinculado) {
    return "sin_vincular";
  }

  if (!enRecorrido) {
    // Un equipo vinculado reporta batería y señal aunque no haya recorrido. Que
    // deje de hacerlo es lo único que delata un teléfono apagado, sin datos o
    // desenchufado mientras la unidad está estacionada: sin esto, un equipo
    // muerto se ve igual que uno sano en reposo.
    //
    // Nunca haber reportado cuenta como caído: significa que la vinculación se
    // completó pero el teléfono no llegó a levantar. Por eso la app manda el
    // primer latido apenas se vincula.
    const caido =
      segundosSinLatido === null || segundosSinLatido > umbralSinSenalS;

    return caido ? "equipo_caido" : "detenida";
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
