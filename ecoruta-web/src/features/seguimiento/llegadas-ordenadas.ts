import {
  estimarLlegada,
  evaluarLlegada,
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

/**
 * Orden de lectura de las llegadas: primero lo que tiene un tiempo, del más
 * cercano al más lejano; después lo que viene sin cifra, lo que no se puede
 * confirmar y lo que ya pasó. La primera es la que se muestra en grande.
 */
const RANGO_SIN_CIFRA = 10_000;
const RANGO_SIN_SENAL = 20_000;
const RANGO_YA_PASO = 30_000;
const RANGO_SIN_RECORRIDO = 40_000;

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
      incidenciaActiva: fila.incidencia_activa,
      penalizacionIncidenciaPct,
    });

    return { fila, estado, tiempo };
  });

  return evaluadas.sort((a, b) => rango(a) - rango(b));
}

function rango({ estado, tiempo }: LlegadaEvaluada): number {
  if (estado.tipo === "sin_recorrido") {
    return RANGO_SIN_RECORRIDO;
  }

  if (estado.tipo === "senal_perdida") {
    return RANGO_SIN_SENAL;
  }

  if (tiempo.tipo === "ya_paso") {
    return RANGO_YA_PASO;
  }

  return tiempo.tipo === "minutos" ? tiempo.minutos : RANGO_SIN_CIFRA;
}
