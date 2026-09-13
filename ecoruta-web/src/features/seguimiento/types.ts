import type { ParadaCercanaRow } from "@/types/database";

export type Ubicacion = {
  lat: number;
  lng: number;
  exactitudM: number;
};

export type EstadoUbicacion =
  | { estado: "pidiendo" }
  | { estado: "concedida"; ubicacion: Ubicacion }
  | { estado: "negada" }
  | { estado: "no_disponible" };

/** Una parada cercana ya agrupada con las rutas que pasan por ella. */
export type ParadaConRutas = {
  paradaId: string;
  nombre: string;
  lat: number;
  lng: number;
  distanciaM: number;
  rutas: RutaEnParada[];
};

export type RutaEnParada = {
  rutaId: string;
  nombre: string;
  tipo: string | null;
  icono: string | null;
  color: string;
};

export function agruparPorParada(
  filas: readonly ParadaCercanaRow[],
): ParadaConRutas[] {
  const paradas = new Map<string, ParadaConRutas>();

  for (const fila of filas) {
    const existente = paradas.get(fila.parada_id);

    if (existente) {
      existente.rutas.push(aRutaEnParada(fila));
      continue;
    }

    paradas.set(fila.parada_id, {
      paradaId: fila.parada_id,
      nombre: fila.parada_nombre,
      lat: fila.parada_lat,
      lng: fila.parada_lng,
      distanciaM: fila.distancia_m,
      rutas: [aRutaEnParada(fila)],
    });
  }

  return [...paradas.values()];
}

function aRutaEnParada(fila: ParadaCercanaRow): RutaEnParada {
  return {
    rutaId: fila.ruta_id,
    nombre: fila.ruta_nombre,
    tipo: fila.ruta_tipo,
    icono: fila.ruta_icono,
    color: fila.ruta_color,
  };
}
