"use client";

import { useEffect, useState, useTransition } from "react";
import type { Lugar } from "@/domain/lugares";
import { latLngATrazado, type Punto } from "@/domain/mapa";
import {
  agregarParada,
  eliminarParada,
  guardarParada,
  guardarTrazadoDeRuta,
} from "../acciones-mapa";
import type { ParadaEditable, Modo } from "../components/LienzoEditor";

type Props = {
  rutaId: string;
  paradasIniciales: readonly ParadaEditable[];
  trazadoInicial: readonly Punto[];
  radioPorDefectoM: number;
  radioMinimoM: number;
};

/**
 * La parada que se está editando. `paradaId` nulo es una parada nueva: un
 * borrador que solo existe en pantalla hasta que el admin lo confirma.
 */
export type Ficha = Omit<ParadaEditable, "id"> & { paradaId: string | null };

export type EstadoFicha =
  | { estado: "editando" }
  | { estado: "guardando" }
  | { estado: "confirmando_eliminar"; error?: string }
  | { estado: "eliminando" }
  | { estado: "error"; mensaje: string };

export type Aviso = { tipo: "exito" | "error"; texto: string; id: number };

/** Para que el mapa vuele al mismo lugar dos veces seguidas, cada pedido es distinto. */
export type Destino = Punto & { id: number };

const DURACION_AVISO_MS = 4000;

/**
 * Estado del editor. Único punto de la feature que llama a las acciones.
 *
 * Nada de las paradas se guarda solo: colocar, mover, renombrar o eliminar pasa
 * por la ficha y se aplica cuando el admin confirma. Así un clic de más en el
 * mapa no crea paradas, y el admin siempre sabe si lo que hizo quedó guardado.
 */
export function useEditorDeRuta({
  rutaId,
  paradasIniciales,
  trazadoInicial,
  radioPorDefectoM,
  radioMinimoM,
}: Props) {
  const [paradas, setParadas] = useState<ParadaEditable[]>([...paradasIniciales]);
  const [trazado, setTrazado] = useState<Punto[]>([...trazadoInicial]);
  const [trazadoGuardado, setTrazadoGuardado] = useState<Punto[]>([...trazadoInicial]);
  const [modo, setModoActual] = useState<Modo>("paradas");
  const [colocando, setColocando] = useState(false);
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [estadoFicha, setEstadoFicha] = useState<EstadoFicha>({ estado: "editando" });
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [destino, setDestino] = useState<Destino | null>(null);
  const [guardandoTrazado, iniciarGuardadoTrazado] = useTransition();

  useEffect(() => {
    if (!aviso) {
      return;
    }

    const temporizador = setTimeout(() => setAviso(null), DURACION_AVISO_MS);
    return () => clearTimeout(temporizador);
  }, [aviso]);

  const original = ficha?.paradaId
    ? (paradas.find((p) => p.id === ficha.paradaId) ?? null)
    : null;
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

  function setModo(nuevo: Modo) {
    if (nuevo !== modo && ficha && !puedeCambiarDeFicha()) {
      return;
    }

    setModoActual(nuevo);
    setFicha(null);
    setColocando(false);
  }

  function clicEnMapa(punto: Punto) {
    if (modo === "trazado") {
      setTrazado((actual) => [...actual, punto]);
      return;
    }

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

    if (modo !== "paradas" || ocupada) {
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

    abrirFicha({
      paradaId: null,
      nombre: lugar.nombre,
      lat: lugar.lat,
      lng: lugar.lng,
      radioM: radioPorDefectoM,
    });
  }

  function seleccionarParada(paradaId: string) {
    if (ficha?.paradaId === paradaId) {
      return;
    }

    if (ficha && !puedeCambiarDeFicha()) {
      return;
    }

    const parada = paradas.find((p) => p.id === paradaId);

    if (parada) {
      const { id, ...resto } = parada;
      abrirFicha({ paradaId: id, ...resto });
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
    if (ocupada) {
      return;
    }

    setFicha(null);
    setColocando(false);
  }

  async function confirmar() {
    if (!ficha || ocupada || problema || !fichaConCambios) {
      return;
    }

    const datos = { ...ficha, nombre: ficha.nombre.trim() };
    setEstadoFicha({ estado: "guardando" });

    const resultado =
      datos.paradaId === null
        ? await agregarParada({ rutaId, ...datos })
        : await guardarParada({ rutaId, ...datos, paradaId: datos.paradaId });

    if (!resultado.ok) {
      setEstadoFicha({
        estado: "error",
        mensaje: resultado.error ?? "No se pudo guardar la parada. Revisa tu conexión y reintenta.",
      });
      return;
    }

    const guardada: ParadaEditable = { ...datos, id: resultado.paradaId! };
    setParadas((actual) =>
      datos.paradaId === null
        ? [...actual, guardada]
        : actual.map((p) => (p.id === guardada.id ? guardada : p)),
    );
    setFicha(null);
    setEstadoFicha({ estado: "editando" });
    avisar(
      "exito",
      datos.paradaId === null
        ? `Parada «${datos.nombre}» guardada.`
        : `Cambios de «${datos.nombre}» guardados.`,
    );
  }

  function pedirEliminar() {
    if (ficha?.paradaId && !ocupada) {
      setEstadoFicha({ estado: "confirmando_eliminar" });
    }
  }

  function noEliminar() {
    setEstadoFicha({ estado: "editando" });
  }

  async function confirmarEliminar() {
    const paradaId = ficha?.paradaId;

    if (!paradaId || !original) {
      return;
    }

    setEstadoFicha({ estado: "eliminando" });
    const resultado = await eliminarParada(rutaId, paradaId);

    if (!resultado.ok) {
      setEstadoFicha({
        estado: "confirmando_eliminar",
        error: resultado.error ?? "No se pudo eliminar la parada.",
      });
      return;
    }

    setParadas((actual) => actual.filter((p) => p.id !== paradaId));
    setFicha(null);
    setEstadoFicha({ estado: "editando" });
    avisar("exito", `Parada «${original.nombre}» eliminada.`);
  }

  function deshacerUltimoPunto() {
    setTrazado((actual) => actual.slice(0, -1));
  }

  function limpiarTrazado() {
    setTrazado([]);
  }

  function guardarTrazadoActual() {
    iniciarGuardadoTrazado(async () => {
      const resultado = await guardarTrazadoDeRuta(rutaId, latLngATrazado(trazado));

      if (!resultado.ok) {
        avisar("error", resultado.error ?? "No se pudo guardar el trazado.");
        return;
      }

      setTrazadoGuardado(trazado);
      avisar("exito", "Trazado guardado.");
    });
  }

  return {
    paradas,
    trazado,
    modo,
    colocando,
    ficha,
    estadoFicha,
    fichaConCambios,
    problema,
    ocupada,
    aviso,
    destino,
    trazadoSinGuardar: !mismoTrazado(trazado, trazadoGuardado),
    guardandoTrazado,
    setModo,
    clicEnMapa,
    empezarAColocar,
    elegirLugar,
    seleccionarParada,
    cambiarFicha,
    cancelar,
    confirmar,
    pedirEliminar,
    noEliminar,
    confirmarEliminar,
    cerrarAviso: () => setAviso(null),
    deshacerUltimoPunto,
    limpiarTrazado,
    guardarTrazadoActual,
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

function distinta(ficha: Ficha, parada: ParadaEditable): boolean {
  return (
    ficha.nombre.trim() !== parada.nombre ||
    ficha.lat !== parada.lat ||
    ficha.lng !== parada.lng ||
    ficha.radioM !== parada.radioM
  );
}

function mismoTrazado(a: readonly Punto[], b: readonly Punto[]): boolean {
  return (
    a.length === b.length &&
    a.every((punto, i) => punto.lat === b[i].lat && punto.lng === b[i].lng)
  );
}
