import {
  estimarLlegada,
  evaluarLlegada,
  rangoDeLlegada,
  type EstadoLlegada,
  type TiempoLlegada,
} from "@/domain/llegadas";
import type { LlegadaRow } from "@/services/llegadas.service";

export type AjustesDeLlegada = {
  umbralSinSenalS: number;
  penalizacionIncidenciaPct: number;
};

export type LlegadaEvaluada = {
  fila: LlegadaRow;
  estado: EstadoLlegada;
  tiempo: TiempoLlegada;
};

/** Las llegadas en orden de lectura (ver `rangoDeLlegada`). La primera se muestra en grande. */
export function evaluarLlegadas(
  filas: readonly LlegadaRow[],
  { umbralSinSenalS, penalizacionIncidenciaPct }: AjustesDeLlegada,
): LlegadaEvaluada[] {
  const evaluadas = filas.map((fila) => {
    const estado = evaluarLlegada({
      enViaje: fila.viaje_id !== null,
      segundosSinSenal: fila.segundos_sin_senal,
      umbralSinSenalS,
    });
    const tiempo = estimarLlegada({
      estado,
      rutaTieneTrazado: fila.ruta_tiene_trazado,
      distanciaTrazadoM: fila.distancia_trazado_m,
      yaPaso: fila.ya_paso,
      velocidadesKmh: fila.velocidades_kmh ?? [],
      velocidadHistoricaKmh: fila.velocidad_historica_kmh,
      incidenciaActiva: fila.incidencia_activa,
      penalizacionIncidenciaPct,
    });

    return { fila, estado, tiempo };
  });

  return evaluadas.sort((a, b) => rangoDeLlegada(a.estado, a.tiempo) - rangoDeLlegada(b.estado, b.tiempo));
}
