"use client";

import { useEffect, useState, useTransition } from "react";
import type { Aviso } from "@/components/ui/AvisoFlotante";
import { latLngATrazado, type Punto } from "@/domain/mapa";
import type { ParadaDeRuta } from "@/services/rutas.service";
import { guardarTrazadoDeRuta } from "../acciones-mapa";

export type { ParadaDeRuta };

type Props = {
  rutaId: string;
  trazadoInicial: readonly Punto[];
  paradasDeRutaIniciales: readonly ParadaDeRuta[];
};

const DURACION_AVISO_MS = 4000;

/**
 * El trazado de la ruta. Las paradas no se editan aquí: la ruta pasa por las
 * que toca su trazado, y al guardarlo la base devuelve cuáles son.
 */
export function useEditorDeRuta({ rutaId, trazadoInicial, paradasDeRutaIniciales }: Props) {
  const [trazado, setTrazado] = useState<Punto[]>([...trazadoInicial]);
  const [trazadoGuardado, setTrazadoGuardado] = useState<Punto[]>([...trazadoInicial]);
  const [paradasDeRuta, setParadasDeRuta] = useState<ParadaDeRuta[]>([...paradasDeRutaIniciales]);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [guardando, iniciarGuardado] = useTransition();

  useEffect(() => {
    if (!aviso) {
      return;
    }

    const temporizador = setTimeout(() => setAviso(null), DURACION_AVISO_MS);
    return () => clearTimeout(temporizador);
  }, [aviso]);

  function guardar() {
    iniciarGuardado(async () => {
      const resultado = await guardarTrazadoDeRuta(rutaId, latLngATrazado(trazado));

      if (!resultado.ok) {
        setAviso({ tipo: "error", texto: resultado.error, id: Date.now() });
        return;
      }

      setTrazadoGuardado(trazado);
      setParadasDeRuta(resultado.paradasDeRuta);
      setAviso({
        tipo: "exito",
        texto: `Trazado guardado. La ruta pasa por ${resultado.paradasDeRuta.length} paradas.`,
        id: Date.now(),
      });
    });
  }

  return {
    trazado,
    paradasDeRuta,
    sinGuardar: !mismoTrazado(trazado, trazadoGuardado),
    guardando,
    aviso,
    agregarPunto: (punto: Punto) => setTrazado((actual) => [...actual, punto]),
    deshacerUltimoPunto: () => setTrazado((actual) => actual.slice(0, -1)),
    limpiar: () => setTrazado([]),
    guardar,
    cerrarAviso: () => setAviso(null),
  };
}

function mismoTrazado(a: readonly Punto[], b: readonly Punto[]): boolean {
  return a.length === b.length && a.every((punto, i) => punto.lat === b[i].lat && punto.lng === b[i].lng);
}
