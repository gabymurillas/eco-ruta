"use client";

import { useState, useTransition } from "react";
import { latLngATrazado, type Punto } from "@/domain/mapa";
import {
  agregarParada,
  eliminarParada,
  guardarTrazadoDeRuta,
  moverParada,
} from "../acciones-mapa";
import type { ParadaEditable, Modo } from "../components/LienzoEditor";

type Props = {
  rutaId: string;
  paradasIniciales: readonly ParadaEditable[];
  trazadoInicial: readonly Punto[];
  radioPorDefectoM: number;
};

/**
 * Estado del editor. Único punto de la feature que llama a las acciones.
 *
 * Los cambios se aplican primero en memoria y después se persisten: arrastrar una
 * parada y esperar al servidor para verla moverse haría el mapa inusable. Si el
 * servidor rechaza, se revierte y se muestra el error.
 */
export function useEditorDeRuta({
  rutaId,
  paradasIniciales,
  trazadoInicial,
  radioPorDefectoM,
}: Props) {
  const [paradas, setParadas] = useState<ParadaEditable[]>([...paradasIniciales]);
  const [trazado, setTrazado] = useState<Punto[]>([...trazadoInicial]);
  const [modo, setModo] = useState<Modo>("paradas");
  const [seleccionada, setSeleccionada] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, iniciarGuardado] = useTransition();

  const paradaSeleccionada = paradas.find((p) => p.id === seleccionada) ?? null;
  const trazadoSinGuardar = !mismoTrazado(trazado, trazadoInicial);

  function clicEnMapa(punto: Punto) {
    if (modo === "trazado") {
      setTrazado((actual) => [...actual, punto]);
      return;
    }

    const nombre = `Parada ${paradas.length + 1}`;
    const provisional: ParadaEditable = {
      id: `provisional-${Date.now()}`,
      nombre,
      lat: punto.lat,
      lng: punto.lng,
      radioM: radioPorDefectoM,
    };

    setParadas((actual) => [...actual, provisional]);
    setError(null);

    iniciarGuardado(async () => {
      const resultado = await agregarParada({
        rutaId,
        nombre,
        lat: punto.lat,
        lng: punto.lng,
        radioM: radioPorDefectoM,
      });

      if (!resultado.ok) {
        setParadas((actual) => actual.filter((p) => p.id !== provisional.id));
        setError(resultado.error ?? "No se pudo crear la parada.");
        return;
      }

      // El id real llega del servidor: hasta entonces la parada existe solo en pantalla.
      setParadas((actual) =>
        actual.map((p) =>
          p.id === provisional.id ? { ...p, id: resultado.paradaId! } : p,
        ),
      );
      setSeleccionada(resultado.paradaId!);
    });
  }

  function moverEnMapa(paradaId: string, punto: Punto) {
    const anterior = paradas.find((p) => p.id === paradaId);

    if (!anterior) {
      return;
    }

    setParadas((actual) =>
      actual.map((p) => (p.id === paradaId ? { ...p, ...punto } : p)),
    );

    persistirParada({ ...anterior, ...punto });
  }

  function cambiarRadio(radioM: number) {
    if (!paradaSeleccionada) {
      return;
    }

    setParadas((actual) =>
      actual.map((p) => (p.id === paradaSeleccionada.id ? { ...p, radioM } : p)),
    );
  }

  /** El radio se persiste al soltar el deslizador, no en cada píxel que se arrastra. */
  function confirmarRadio() {
    if (paradaSeleccionada) {
      persistirParada(paradaSeleccionada);
    }
  }

  function persistirParada(parada: ParadaEditable) {
    setError(null);

    iniciarGuardado(async () => {
      const resultado = await moverParada({
        rutaId,
        paradaId: parada.id,
        lat: parada.lat,
        lng: parada.lng,
        radioM: parada.radioM,
      });

      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo guardar el cambio.");
      }
    });
  }

  function quitarParada(paradaId: string) {
    const respaldo = paradas;
    setParadas((actual) => actual.filter((p) => p.id !== paradaId));
    setSeleccionada(null);
    setError(null);

    iniciarGuardado(async () => {
      const resultado = await eliminarParada(rutaId, paradaId);

      if (!resultado.ok) {
        setParadas(respaldo);
        setError(resultado.error ?? "No se pudo eliminar la parada.");
      }
    });
  }

  function deshacerUltimoPunto() {
    setTrazado((actual) => actual.slice(0, -1));
  }

  function limpiarTrazado() {
    setTrazado([]);
  }

  function guardarTrazadoActual() {
    setError(null);

    iniciarGuardado(async () => {
      const resultado = await guardarTrazadoDeRuta(rutaId, latLngATrazado(trazado));

      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo guardar el trazado.");
      }
    });
  }

  return {
    paradas,
    trazado,
    modo,
    seleccionada,
    paradaSeleccionada,
    trazadoSinGuardar,
    guardando,
    error,
    setModo,
    setSeleccionada,
    clicEnMapa,
    moverEnMapa,
    cambiarRadio,
    confirmarRadio,
    quitarParada,
    deshacerUltimoPunto,
    limpiarTrazado,
    guardarTrazadoActual,
  };
}

function mismoTrazado(a: readonly Punto[], b: readonly Punto[]): boolean {
  return (
    a.length === b.length &&
    a.every((punto, i) => punto.lat === b[i].lat && punto.lng === b[i].lng)
  );
}
