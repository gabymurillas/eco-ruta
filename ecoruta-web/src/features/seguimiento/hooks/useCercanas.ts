"use client";

import { useCallback, useState } from "react";
import {
  buscarParadaMasCercana,
  buscarParadasCercanas,
} from "@/services/paradas.service";
import { guardarMiParada, leerMiParada } from "@/services/preferencias.service";
import type { Resultado } from "@/services/resultado";
import { obtenerUbicacionActual } from "@/services/ubicacion.service";
import {
  agruparPorParada,
  sinDistancia,
  type EstadoUbicacion,
  type ParadaConRutas,
  type Ubicacion,
} from "../types";

export type EstadoDePedido = EstadoUbicacion | { estado: "sin_pedir" };

/**
 * La ubicación del ciudadano y las paradas que tiene cerca.
 *
 * La ubicación se lee una vez por pedido, no se vigila: las geocercas se
 * evalúan en el servidor contra la unidad, así que la web no necesita seguir al
 * ciudadano ni gastarle batería y datos.
 */
export function useCercanas() {
  const [ubicacion, setUbicacion] = useState<EstadoDePedido>({
    estado: "sin_pedir",
  });
  const [cercanas, setCercanas] = useState<Resultado<ParadaConRutas[]> | null>(
    null,
  );
  const [masCercana, setMasCercana] = useState<ParadaConRutas | null>(null);

  const pedirUbicacion = useCallback(async () => {
    setUbicacion({ estado: "pidiendo" });
    const resultado = await obtenerUbicacionActual();
    setUbicacion(resultado);

    if (resultado.estado !== "concedida") {
      return;
    }

    const encontradas = await buscarCercanas(resultado.ubicacion);
    setMasCercana(
      encontradas.ok && encontradas.datos.length === 0
        ? await buscarLejana(resultado.ubicacion)
        : null,
    );
    setCercanas(encontradas);
  }, []);

  return { ubicacion, cercanas, masCercana, pedirUbicacion };
}

/**
 * En la primera visita la más cercana queda guardada sin preguntar: el
 * ciudadano ve su parada de una vez y la cambia si no es la suya.
 */
async function buscarCercanas(
  ubicacion: Ubicacion,
): Promise<Resultado<ParadaConRutas[]>> {
  const busqueda = await buscarParadasCercanas(ubicacion);

  if (!busqueda.ok) {
    return busqueda;
  }

  const paradas = agruparPorParada(busqueda.datos);

  if (!leerMiParada() && paradas.length > 0) {
    guardarMiParada(sinDistancia(paradas[0]));
  }

  return { ok: true, datos: paradas };
}

/**
 * Fuera del radio no se guarda nada solo: una parada a varios kilómetros
 * difícilmente es la suya, así que la elige el ciudadano si quiere.
 * Si la búsqueda falla, la pantalla dice lo de siempre: no hay paradas cerca.
 */
async function buscarLejana(
  ubicacion: Ubicacion,
): Promise<ParadaConRutas | null> {
  const busqueda = await buscarParadaMasCercana(ubicacion);
  return busqueda.ok ? (agruparPorParada(busqueda.datos)[0] ?? null) : null;
}
