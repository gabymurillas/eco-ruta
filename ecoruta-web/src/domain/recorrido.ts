/**
 * El recorrido de una ruta para el ciudadano (CIU-16): sus paradas en orden y, en
 * cada una, la próxima unidad.
 *
 * No hay cálculo propio: cada par parada–unidad pasa por las mismas reglas que
 * «mi parada» (`evaluarLlegada`, `estimarLlegada`, `rangoDeLlegada`). Si el detalle
 * de ruta y mi parada dijeran tiempos distintos para la misma unidad, ninguno de
 * los dos sería creíble.
 */
import {
  estimarLlegada,
  evaluarLlegada,
  rangoDeLlegada,
  type EstadoLlegada,
  type TiempoLlegada,
} from "./llegadas";

/** Una fila de `llegadas_de_ruta`: la parada, y la unidad si viene alguna. */
export type FilaDeRecorrido = {
  paradaId: string;
  paradaNombre: string;
  paradaLat: number;
  paradaLng: number;
  unidadId: string | null;
  unidadNombre: string | null;
  unidadLat: number | null;
  unidadLng: number | null;
  viajeId: string | null;
  segundosSinSenal: number | null;
  distanciaTrazadoM: number | null;
  yaPaso: boolean;
  velocidadesKmh: readonly (number | null)[];
  incidenciaActiva: boolean;
  velocidadHistoricaKmh: number | null;
};

export type AjustesDelRecorrido = {
  umbralSinSenalS: number;
  penalizacionIncidenciaPct: number;
};

export type ProximaLlegada = {
  unidadId: string;
  unidadNombre: string;
  estado: EstadoLlegada;
  tiempo: TiempoLlegada;
};

export type ParadaDelRecorrido = {
  paradaId: string;
  nombre: string;
  lat: number;
  lng: number;
  /** Null si ninguna unidad de la ruta está en recorrido. */
  proxima: ProximaLlegada | null;
};

export type UnidadDelRecorrido = {
  unidadId: string;
  nombre: string;
  lat: number;
  lng: number;
  estado: EstadoLlegada;
};

export type Recorrido = {
  paradas: ParadaDelRecorrido[];
  unidades: UnidadDelRecorrido[];
  incidenciaActiva: boolean;
};

/** Las filas llegan ordenadas por avance sobre el trazado; ese orden se conserva. */
export function armarRecorrido(
  filas: readonly FilaDeRecorrido[],
  ajustes: AjustesDelRecorrido,
): Recorrido {
  const porParada = new Map<string, FilaDeRecorrido[]>();

  for (const fila of filas) {
    porParada.set(fila.paradaId, [...(porParada.get(fila.paradaId) ?? []), fila]);
  }

  return {
    paradas: [...porParada.values()].map((grupo) => paradaDelRecorrido(grupo, ajustes)),
    unidades: unidadesDelRecorrido(filas, ajustes),
    incidenciaActiva: filas.some((fila) => fila.incidenciaActiva),
  };
}

function paradaDelRecorrido(
  grupo: readonly FilaDeRecorrido[],
  ajustes: AjustesDelRecorrido,
): ParadaDelRecorrido {
  const [primera] = grupo;
  const candidatas = grupo
    .map((fila) => llegadaDe(fila, ajustes))
    .filter((llegada): llegada is ProximaLlegada => llegada !== null)
    // Una unidad fuera de recorrido no «viene»: la parada queda sin próxima.
    .filter((llegada) => llegada.estado.tipo !== "sin_recorrido")
    .sort((a, b) => rangoDeLlegada(a.estado, a.tiempo) - rangoDeLlegada(b.estado, b.tiempo));

  return {
    paradaId: primera.paradaId,
    nombre: primera.paradaNombre,
    lat: primera.paradaLat,
    lng: primera.paradaLng,
    proxima: candidatas[0] ?? null,
  };
}

function estadoDe(fila: FilaDeRecorrido, ajustes: AjustesDelRecorrido): EstadoLlegada {
  return evaluarLlegada({
    enViaje: fila.viajeId !== null,
    segundosSinSenal: fila.segundosSinSenal,
    umbralSinSenalS: ajustes.umbralSinSenalS,
  });
}

function llegadaDe(fila: FilaDeRecorrido, ajustes: AjustesDelRecorrido): ProximaLlegada | null {
  if (fila.unidadId === null || fila.unidadNombre === null) {
    return null;
  }

  const estado = estadoDe(fila, ajustes);
  const tiempo = estimarLlegada({
    estado,
    // Una parada solo está en el recorrido si la ruta tiene trazado (paradas_por_ruta).
    rutaTieneTrazado: true,
    distanciaTrazadoM: fila.distanciaTrazadoM,
    yaPaso: fila.yaPaso,
    velocidadesKmh: fila.velocidadesKmh,
    velocidadHistoricaKmh: fila.velocidadHistoricaKmh,
    incidenciaActiva: fila.incidenciaActiva,
    penalizacionIncidenciaPct: ajustes.penalizacionIncidenciaPct,
  });

  return { unidadId: fila.unidadId, unidadNombre: fila.unidadNombre, estado, tiempo };
}

/** Cada unidad aparece una vez por parada en las filas: aquí, una sola vez. */
function unidadesDelRecorrido(
  filas: readonly FilaDeRecorrido[],
  ajustes: AjustesDelRecorrido,
): UnidadDelRecorrido[] {
  const unidades = new Map<string, UnidadDelRecorrido>();

  for (const fila of filas) {
    if (fila.unidadId === null || fila.unidadLat === null || fila.unidadLng === null || unidades.has(fila.unidadId)) {
      continue;
    }

    unidades.set(fila.unidadId, {
      unidadId: fila.unidadId,
      nombre: fila.unidadNombre ?? "",
      lat: fila.unidadLat,
      lng: fila.unidadLng,
      estado: estadoDe(fila, ajustes),
    });
  }

  return [...unidades.values()];
}
