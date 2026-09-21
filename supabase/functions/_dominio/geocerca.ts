/**
 * Reglas de permanencia e histéresis de las geocercas.
 *
 * Funciones puras. Deciden *qué* hay que escribir; escribirlo es trabajo de
 * quien las llama. Separarlo permite probar el comportamiento completo —entrar,
 * esperar, notificar, salir, reentrar— sin base de datos.
 *
 * Por qué no basta con "está dentro del radio, notifica": la deriva del GPS hace
 * que una unidad detenida entre y salga de la geocerca varias veces por minuto.
 * Sin permanencia mínima el ciudadano recibe una ráfaga de notificaciones, y sin
 * histéresis el sistema cree que la unidad se fue y volvió diez veces.
 */

/** Una parada de la ruta del viaje, con el evento que ya tenga (si tiene). */
export type EstadoDeParada = {
  paradaId: string;
  dentro: boolean;
  /**
   * Una parada con `notifica = false` sí registra eventos —la cobertura de
   * paradas se calcula con ellos— pero nunca alerta al ciudadano. Sirve para
   * puntos de control internos que no son parada de pasajeros.
   */
  notifica: boolean;
  /** null si todavía no hay evento para esta parada en este viaje. */
  entroAt: string | null;
  notificadoAt: string | null;
  salioAt: string | null;
};

export type Accion =
  | { tipo: "crear_evento"; paradaId: string }
  | { tipo: "notificar"; paradaId: string }
  | { tipo: "registrar_salida"; paradaId: string }
  | { tipo: "anular_salida"; paradaId: string };

export type Umbrales = {
  permanenciaMinimaS: number;
  histeresisSalidaS: number;
};

export function decidirAcciones(
  estados: EstadoDeParada[],
  ahora: Date,
  umbrales: Umbrales,
): Accion[] {
  return estados.flatMap((estado) => decidirUna(estado, ahora, umbrales));
}

function decidirUna(
  estado: EstadoDeParada,
  ahora: Date,
  { permanenciaMinimaS, histeresisSalidaS }: Umbrales,
): Accion[] {
  const { paradaId, dentro, entroAt, salioAt } = estado;

  if (!dentro) {
    // Estar fuera no es salir todavía: se anota el momento y la salida se
    // confirma sola si no reentra antes de que venza la histéresis.
    const salidaSinAnotar = entroAt !== null && salioAt === null;

    return salidaSinAnotar ? [{ tipo: "registrar_salida", paradaId }] : [];
  }

  if (entroAt === null) {
    // Primera vez dentro: empieza a correr la permanencia. No se notifica aún,
    // porque pasar por al lado no es llegar.
    return [{ tipo: "crear_evento", paradaId }];
  }

  if (salioAt !== null) {
    if (segundosEntre(salioAt, ahora) >= histeresisSalidaS) {
      // Estuvo fuera el tiempo suficiente: la salida es real y cierra el evento
      // para este viaje. Que reentre después no vuelve a notificar — sería la
      // misma unidad en la misma parada del mismo recorrido.
      return [];
    }

    // Reentró antes de que venciera la histéresis: se considera que nunca salió.
    // Esto es lo que absorbe la deriva del GPS en una unidad detenida.
    return [
      { tipo: "anular_salida", paradaId },
      ...decidirNotificacion(estado, ahora, permanenciaMinimaS),
    ];
  }

  return decidirNotificacion(estado, ahora, permanenciaMinimaS);
}

function decidirNotificacion(
  { paradaId, notifica, entroAt, notificadoAt }: EstadoDeParada,
  ahora: Date,
  permanenciaMinimaS: number,
): Accion[] {
  if (!notifica || notificadoAt !== null || entroAt === null) {
    return [];
  }

  const permanencia = segundosEntre(entroAt, ahora);

  return permanencia >= permanenciaMinimaS ? [{ tipo: "notificar", paradaId }] : [];
}

function segundosEntre(desde: string, hasta: Date): number {
  return (hasta.getTime() - new Date(desde).getTime()) / 1000;
}
