import { evaluarLlegada } from "@/domain/llegadas";
import type { LlegadaRow } from "@/services/llegadas.service";
import type { ParadaVisible, UnidadVisible } from "./components/LienzoSeguimiento";
import type { ParadaConRutas, ParadaElegida } from "./types";

/** Mi parada destacada; las de alrededor, para que el ciudadano se ubique. */
export function paradasDelMapa(
  parada: ParadaElegida,
  otras: readonly ParadaConRutas[],
): ParadaVisible[] {
  return [
    parada,
    ...otras.filter((otra) => otra.paradaId !== parada.paradaId),
  ].map((actual) => ({
    id: actual.paradaId,
    nombre: actual.nombre,
    lat: actual.lat,
    lng: actual.lng,
    color: actual.rutas[0]?.color ?? null,
    destacada: actual.paradaId === parada.paradaId,
  }));
}

export function unidadesDelMapa(
  llegadas: readonly LlegadaRow[],
  umbralSinSenalS: number,
): UnidadVisible[] {
  return llegadas.flatMap((llegada) =>
    llegada.unidad_lat === null || llegada.unidad_lng === null
      ? []
      : [
          {
            id: llegada.unidad_id,
            nombre: llegada.unidad_nombre,
            lat: llegada.unidad_lat,
            lng: llegada.unidad_lng,
            rutaNombre: llegada.ruta_nombre,
            color: llegada.ruta_color,
            icono: llegada.ruta_icono,
            transmitiendo: estaTransmitiendo(llegada, umbralSinSenalS),
          },
        ],
  );
}

/** Con el último refresco fallido no se puede afirmar «en vivo». */
export function hayUnidadEnVivo(
  llegadas: readonly LlegadaRow[] | null,
  falla: string | null,
  umbralSinSenalS: number,
): boolean {
  if (falla || !llegadas) {
    return false;
  }

  return llegadas.some((llegada) => estaTransmitiendo(llegada, umbralSinSenalS));
}

function estaTransmitiendo(llegada: LlegadaRow, umbralSinSenalS: number): boolean {
  const estado = evaluarLlegada({
    enViaje: llegada.viaje_id !== null,
    segundosSinSenal: llegada.segundos_sin_senal,
    umbralSinSenalS,
  });

  return estado.tipo === "en_camino";
}
