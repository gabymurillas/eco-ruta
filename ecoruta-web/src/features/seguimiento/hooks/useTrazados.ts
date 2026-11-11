"use client";

import { useEffect, useMemo, useState } from "react";
import { trazadoALatLng, type Punto } from "@/domain/mapa";
import { obtenerRutasDeMapaPublicas } from "@/services/mapa-publico.service";

export type TrazadoVisible = {
  rutaId: string;
  color: string;
  puntos: Punto[];
};

/**
 * Trazado de las rutas que pasan por la parada, para dibujarlas en el mapa.
 *
 * Se piden todas una sola vez (son pocas y públicas, ver la política de
 * exposición) y se filtran aquí: cambiar de parada no vuelve a gastar datos.
 * Si la consulta falla, el mapa se queda sin líneas; las llegadas no dependen
 * de ellas.
 */
export function useTrazados(rutaIds: readonly string[]): TrazadoVisible[] {
  const [todos, setTodos] = useState<TrazadoVisible[]>([]);

  useEffect(() => {
    let vigente = true;

    obtenerRutasDeMapaPublicas().then((resultado) => {
      if (vigente && resultado.ok) {
        setTodos(
          resultado.datos.map((ruta) => ({
            rutaId: ruta.ruta_id,
            color: ruta.ruta_color,
            puntos: trazadoALatLng(ruta.trazado_geojson),
          })),
        );
      }
    });

    return () => {
      vigente = false;
    };
  }, []);

  const clave = rutaIds.join("|");

  return useMemo(
    () => todos.filter((trazado) => rutaIds.includes(trazado.rutaId)),
    // `rutaIds` llega como arreglo nuevo en cada render: `clave` es su contenido.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [todos, clave],
  );
}
