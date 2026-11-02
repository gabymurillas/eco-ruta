"use client";

import { useCallback, useEffect, useState } from "react";
import {
  avisosVigentes,
  MINUTOS_DE_VIGENCIA,
  type Aviso,
} from "@/domain/avisos";
import { escucharAvisos, obtenerAvisosDesde } from "@/services/avisos.service";

/** Corta y reconocible en la mano, sin ser una alarma. */
const PATRON_DE_VIBRACION_MS = [200, 100, 200];

/** Cada cuánto se revisa si un aviso ya venció, aunque no llegue nada nuevo. */
const SEGUNDOS_ENTRE_REVISIONES = 30;

const MS_POR_MINUTO = 60_000;

/**
 * Los avisos de «mi parada»: los recientes al abrir y los nuevos por Realtime.
 *
 * Solo vibra lo que llega en vivo. Los que ya estaban al abrir la página se
 * muestran en silencio: vibrar por algo de hace cinco minutos sería un susto
 * sin motivo.
 */
export function useAvisosDeParada(paradaId: string | null) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [descartados, setDescartados] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const [ahora, setAhora] = useState(() => new Date());

  useEffect(() => {
    if (!paradaId) {
      return;
    }

    let vigente = true;
    const agregar = (nuevos: Aviso[]) => {
      if (vigente) {
        setAvisos((actuales) => [...actuales, ...nuevos]);
        setAhora(new Date());
      }
    };

    const dejarDeEscuchar = suscribir(paradaId, agregar);
    const revision = setInterval(
      () => setAhora(new Date()),
      SEGUNDOS_ENTRE_REVISIONES * 1000,
    );

    return () => {
      vigente = false;
      dejarDeEscuchar();
      clearInterval(revision);
      setAvisos([]);
    };
  }, [paradaId]);

  const descartar = useCallback((avisoId: string) => {
    setDescartados((actuales) => new Set(actuales).add(avisoId));
  }, []);

  return {
    avisos: avisosVigentes(avisos, ahora).filter(
      (aviso) => !descartados.has(aviso.id),
    ),
    descartar,
  };
}

/**
 * Primero se cargan los recientes y después se escucha. Si un aviso llega justo
 * entre las dos cosas aparece dos veces en la lista, pero `avisosVigentes` se
 * queda con uno por viaje, así que en pantalla no se duplica.
 */
function suscribir(paradaId: string, agregar: (avisos: Aviso[]) => void) {
  const desde = new Date(Date.now() - MINUTOS_DE_VIGENCIA * MS_POR_MINUTO);

  obtenerAvisosDesde(paradaId, desde).then((resultado) => {
    if (resultado.ok) {
      agregar(resultado.datos);
    }
  });

  return escucharAvisos(paradaId, (aviso) => {
    agregar([aviso]);
    vibrar();
  });
}

function vibrar() {
  // Safari no implementa la API; ahí el aviso queda solo en pantalla.
  if ("vibrate" in navigator) {
    navigator.vibrate(PATRON_DE_VIBRACION_MS);
  }
}
