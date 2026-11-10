/**
 * Estado del teléfono de una unidad, tal como lo lee la sección Unidades.
 *
 * El monitoreo pregunta «¿está en servicio?»; aquí la pregunta es otra: «¿el
 * teléfono está atado a la unidad y vivo?». Por eso no depende del recorrido.
 */

export type EstadoTelefono = "vinculado" | "sin_reportar" | "codigo_pendiente" | "sin_vincular";

export type EntradaTelefono = {
  vinculado: boolean;
  /** Desde el último reporte del teléfono; null si nunca reportó. */
  segundosSinReporte: number | null;
  codigoVigente: boolean;
  umbralSinSenalS: number;
};

export function estadoDelTelefono({
  vinculado,
  segundosSinReporte,
  codigoVigente,
  umbralSinSenalS,
}: EntradaTelefono): EstadoTelefono {
  if (vinculado) {
    // Vinculado pero callado es lo que hay que ver: teléfono apagado, sin datos
    // o desenchufado. Que nunca haya reportado cuenta igual.
    return segundosSinReporte === null || segundosSinReporte > umbralSinSenalS
      ? "sin_reportar"
      : "vinculado";
  }

  return codigoVigente ? "codigo_pendiente" : "sin_vincular";
}

/** Segundos entre un instante guardado y ahora; null si no hay instante. */
export function segundosDesde(instanteIso: string | null, ahora: Date): number | null {
  if (!instanteIso) {
    return null;
  }

  return Math.max(0, Math.floor((ahora.getTime() - new Date(instanteIso).getTime()) / 1000));
}
