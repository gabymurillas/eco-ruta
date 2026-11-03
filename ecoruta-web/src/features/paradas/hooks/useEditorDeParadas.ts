"use client";

import { useEffect, useState } from "react";
import type { Lugar } from "@/domain/lugares";
import type { Destino } from "@/components/mapa/ControlesDeMapa";
import type { Aviso } from "@/components/ui/AvisoFlotante";
import type { Punto } from "@/domain/mapa";
import type { ParadaDeLaCiudad } from "@/services/catalogo-paradas.service";
import { agregarParada, eliminarParada, guardarParada } from "../acciones";

export type { ParadaDeLaCiudad };

type Props = {
  /** Vienen del servidor: cada acción revalida la página y llegan ya actualizadas. */
  paradas: readonly ParadaDeLaCiudad[];
  radioPorDefectoM: number;
  radioMinimoM: number;
};

/**
 * La parada que se está editando. `paradaId` nulo es una parada nueva: un
 * borrador que solo existe en pantalla hasta que el admin lo confirma.
 */
export type Ficha = Pick<ParadaDeLaCiudad, "nombre" | "lat" | "lng" | "radioM"> & {
  paradaId: string | null;
};

export type EstadoFicha =
  | { estado: "editando" }
  | { estado: "guardando" }
  | { estado: "confirmando_eliminar"; error?: string }
  | { estado: "eliminando" }
  | { estado: "error"; mensaje: string };



const DURACION_AVISO_MS = 4000;

/**
 * Estado del catálogo de paradas. Único punto de la feature que llama a las acciones.
 *
 * Nada se guarda solo: colocar, mover, renombrar o eliminar pasa por la ficha y
 * se aplica cuando el admin confirma. Así un clic de más en el mapa no crea
 * paradas, y el admin siempre sabe si lo que hizo quedó guardado.
 */
export function useEditorDeParadas({ paradas, radioPorDefectoM, radioMinimoM }: Props) {
  const [colocando, setColocando] = useState(false);
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [estadoFicha, setEstadoFicha] = useState<EstadoFicha>({ estado: "editando" });
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [destino, setDestino] = useState<Destino | null>(null);

  useEffect(() => {
    if (!aviso) {
      return;
    }

    const temporizador = setTimeout(() => setAviso(null), DURACION_AVISO_MS);
    return () => clearTimeout(temporizador);
  }, [aviso]);

  const original = ficha?.paradaId ? (paradas.find((p) => p.id === ficha.paradaId) ?? null) : null;
  const fichaConCambios = ficha !== null && (original === null || distinta(ficha, original));
  const ocupada = estadoFicha.estado === "guardando" || estadoFicha.estado === "eliminando";
  const problema = ficha ? validarFicha(ficha, radioMinimoM) : null;

  function avisar(tipo: Aviso["tipo"], texto: string) {
    setAviso({ tipo, texto, id: Date.now() });
  }

  function abrirFicha(nueva: Ficha) {
    setFicha(nueva);
    setEstadoFicha({ estado: "editando" });
    setColocando(false);
  }

  /** Abrir otra parada con cambios sin guardar los perdería sin avisar. */
  function puedeCambiarDeFicha(): boolean {
    if (ocupada) {
      return false;
    }

    if (ficha && fichaConCambios) {
      avisar("error", `Confirma o cancela «${ficha.nombre}» antes de seguir.`);
      return false;
    }

    return true;
  }

  function clicEnMapa(punto: Punto) {
    if (ocupada) {
      return;
    }

    // Con la ficha abierta, otro clic mueve esa parada en vez de crear otra.
    if (ficha) {
      setFicha({ ...ficha, ...punto });
      return;
    }

    if (colocando) {
      abrirFicha({
        paradaId: null,
        nombre: `Parada ${paradas.length + 1}`,
        radioM: radioPorDefectoM,
        ...punto,
      });
    }
  }

  function empezarAColocar() {
    if (ficha && !puedeCambiarDeFicha()) {
      return;
    }

    setFicha(null);
    setColocando(true);
  }

  /** Un lugar del buscador crea el borrador ahí, con el nombre del lugar. */
  function elegirLugar(lugar: Lugar) {
    setDestino({ lat: lugar.lat, lng: lugar.lng, id: Date.now() });

    if (ocupada) {
      return;
    }

    if (ficha?.paradaId === null) {
      setFicha({ ...ficha, lat: lugar.lat, lng: lugar.lng, nombre: lugar.nombre });
      setEstadoFicha({ estado: "editando" });
      return;
    }

    if (ficha && !puedeCambiarDeFicha()) {
      return;
    }

    abrirFicha({ paradaId: null, nombre: lugar.nombre, lat: lugar.lat, lng: lugar.lng, radioM: radioPorDefectoM });
  }

  function seleccionarParada(paradaId: string) {
    if (ficha?.paradaId === paradaId || (ficha && !puedeCambiarDeFicha())) {
      return;
    }

    const parada = paradas.find((p) => p.id === paradaId);

    if (parada) {
      abrirFicha({ paradaId: parada.id, nombre: parada.nombre, lat: parada.lat, lng: parada.lng, radioM: parada.radioM });
      setDestino({ lat: parada.lat, lng: parada.lng, id: Date.now() });
    }
  }

  function cambiarFicha(cambio: Partial<Omit<Ficha, "paradaId">>) {
    if (!ficha || ocupada) {
      return;
    }

    setFicha({ ...ficha, ...cambio });

    if (estadoFicha.estado !== "editando") {
      setEstadoFicha({ estado: "editando" });
    }
  }

  function cancelar() {
    if (!ocupada) {
      setFicha(null);
      setColocando(false);
    }
  }

  async function confirmar() {
    if (!ficha || ocupada || problema || !fichaConCambios) {
      return;
    }

    const { paradaId, ...datos } = { ...ficha, nombre: ficha.nombre.trim() };
    setEstadoFicha({ estado: "guardando" });

    const resultado = paradaId === null ? await agregarParada(datos) : await guardarParada(paradaId, datos);

    if (!resultado.ok) {
      setEstadoFicha({
        estado: "error",
        mensaje: resultado.error ?? "No se pudo guardar la parada. Revisa tu conexión y reintenta.",
      });
      return;
    }

    setFicha(null);
    setEstadoFicha({ estado: "editando" });
    avisar("exito", paradaId === null ? `Parada «${datos.nombre}» guardada.` : `Cambios de «${datos.nombre}» guardados.`);
  }

  function pedirEliminar() {
    if (ficha?.paradaId && !ocupada) {
      setEstadoFicha({ estado: "confirmando_eliminar" });
    }
  }

  async function confirmarEliminar() {
    if (!ficha?.paradaId || !original) {
      return;
    }

    setEstadoFicha({ estado: "eliminando" });
    const resultado = await eliminarParada(ficha.paradaId);

    if (!resultado.ok) {
      setEstadoFicha({
        estado: "confirmando_eliminar",
        error: resultado.error ?? "No se pudo eliminar la parada.",
      });
      return;
    }

    setFicha(null);
    setEstadoFicha({ estado: "editando" });
    avisar("exito", `Parada «${original.nombre}» eliminada.`);
  }

  return {
    paradas,
    colocando,
    ficha,
    original,
    estadoFicha,
    fichaConCambios,
    problema,
    ocupada,
    aviso,
    destino,
    clicEnMapa,
    empezarAColocar,
    elegirLugar,
    seleccionarParada,
    cambiarFicha,
    cancelar,
    confirmar,
    pedirEliminar,
    noEliminar: () => setEstadoFicha({ estado: "editando" }),
    confirmarEliminar,
    cerrarAviso: () => setAviso(null),
  };
}

/** Lo mismo que valida el servidor, para explicarlo antes de que el admin confirme. */
function validarFicha(ficha: Ficha, radioMinimoM: number): string | null {
  if (!ficha.nombre.trim()) {
    return "Escribe un nombre para la parada.";
  }

  if (ficha.radioM < radioMinimoM) {
    return `Sube el radio a ${radioMinimoM} m o más: con menos, el GPS no la detecta.`;
  }

  return null;
}

function distinta(ficha: Ficha, parada: ParadaDeLaCiudad): boolean {
  return (
    ficha.nombre.trim() !== parada.nombre ||
    ficha.lat !== parada.lat ||
    ficha.lng !== parada.lng ||
    ficha.radioM !== parada.radioM
  );
}
