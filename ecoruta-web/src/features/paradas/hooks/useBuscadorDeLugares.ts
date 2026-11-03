"use client";

import { useEffect, useState } from "react";
import { leerCoordenadas, type Lugar } from "@/domain/lugares";
import { buscarLugares } from "@/services/lugares.service";

/** Esperar a que el admin deje de teclear: el servicio público pide uso moderado. */
const ESPERA_ENTRE_TECLAS_MS = 300;
const LETRAS_MINIMAS = 3;

export type EstadoBusqueda =
  | { estado: "inactivo" }
  | { estado: "buscando" }
  | { estado: "listo"; lugares: Lugar[] }
  | { estado: "error"; mensaje: string };

type Respuesta = { consulta: string; busqueda: EstadoBusqueda };

export function useBuscadorDeLugares() {
  const [texto, setTexto] = useState("");
  const [respuesta, setRespuesta] = useState<Respuesta | null>(null);

  const consulta = texto.trim();
  const coordenadas = leerCoordenadas(consulta);
  const remota = coordenadas === null && consulta.length >= LETRAS_MINIMAS;

  useEffect(() => {
    if (!remota) {
      return;
    }

    const cancelador = new AbortController();
    const temporizador = setTimeout(async () => {
      const resultado = await buscarLugares(consulta, cancelador.signal);

      if (!cancelador.signal.aborted) {
        setRespuesta({
          consulta,
          busqueda: resultado.ok
            ? { estado: "listo", lugares: resultado.datos }
            : { estado: "error", mensaje: resultado.error },
        });
      }
    }, ESPERA_ENTRE_TECLAS_MS);

    return () => {
      clearTimeout(temporizador);
      cancelador.abort();
    };
  }, [consulta, remota]);

  return {
    texto,
    setTexto,
    busqueda: estadoDeLaBusqueda({ consulta, coordenadas, remota, respuesta }),
    limpiar: () => setTexto(""),
  };
}

type Entrada = {
  consulta: string;
  coordenadas: ReturnType<typeof leerCoordenadas>;
  remota: boolean;
  respuesta: Respuesta | null;
};

/** Unas coordenadas pegadas no necesitan al servicio: ya dicen dónde es. */
function estadoDeLaBusqueda({ consulta, coordenadas, remota, respuesta }: Entrada): EstadoBusqueda {
  if (coordenadas) {
    return {
      estado: "listo",
      lugares: [{ ...coordenadas, id: "coordenadas", nombre: consulta, detalle: "Coordenadas" }],
    };
  }

  if (!remota) {
    return { estado: "inactivo" };
  }

  // Una respuesta de otra consulta es vieja: mientras llega la nueva, se busca.
  return respuesta?.consulta === consulta ? respuesta.busqueda : { estado: "buscando" };
}
