"use client";

import { useEffect, useState } from "react";
import type { Aviso } from "@/components/ui/AvisoFlotante";
import { latLngATrazado, type Punto } from "@/domain/mapa";
import { indiceDeInsercion, simplificar, type PuntoClave } from "@/domain/trazado";
import type { ParadaDeRuta, ViajeGrabado } from "@/services/rutas.service";
import { cargarRecorridoDeViaje, guardarTrazadoDeRuta } from "../acciones-mapa";
import { calcularCamino, caminoDesdeRecorrido } from "./camino";

export type { ParadaDeRuta, PuntoClave, ViajeGrabado };

type Props = {
  rutaId: string;
  trazadoInicial: readonly Punto[];
  puntosClaveIniciales: readonly PuntoClave[];
  paradasDeRutaIniciales: readonly ParadaDeRuta[];
};

/** Qué está haciendo el editor ahora: una sola fuente para no mostrar dos estados a la vez. */
export type Ocupado = "libre" | "calculando" | "cargando_viaje" | "guardando";

const ESPERA_ANTES_DE_CALCULAR_MS = 300;
const DURACION_AVISO_MS = 4500;
/** Para sacar puntos de un trazado viejo hecho a mano: a esta tolerancia conserva las esquinas. */
const TOLERANCIA_CONVERSION_M = 15;

/**
 * El trazado por puntos clave. El admin marca pocos puntos y la línea se
 * calcula por las calles; nada se guarda hasta «Guardar trazado». Las paradas
 * no se editan aquí: al guardar, la base devuelve por cuáles pasa la ruta.
 */
export function useEditorDeRuta({ rutaId, trazadoInicial, puntosClaveIniciales, paradasDeRutaIniciales }: Props) {
  const [puntos, setPuntos] = useState<PuntoClave[]>([...puntosClaveIniciales]);
  const [linea, setLinea] = useState<Punto[]>([...trazadoInicial]);
  const [edicion, setEdicion] = useState(0);
  const [sinGuardar, setSinGuardar] = useState(false);
  const [ocupado, setOcupado] = useState<Ocupado>("libre");
  const [errorCamino, setErrorCamino] = useState<string | null>(null);
  const [paradasDeRuta, setParadasDeRuta] = useState<ParadaDeRuta[]>([...paradasDeRutaIniciales]);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  // El camino se recalcula cuando el admin cambia los puntos, no al abrir: la
  // línea guardada ya es la de esos puntos.
  useEffect(() => {
    if (edicion === 0) {
      return;
    }

    const cancelador = new AbortController();
    const temporizador = setTimeout(async () => {
      const camino = await calcularCamino(puntos, cancelador.signal);

      if (cancelador.signal.aborted) {
        return;
      }

      setOcupado("libre");
      setErrorCamino(camino.ok ? null : camino.error);

      if (camino.ok) {
        setLinea(camino.datos);
      }
    }, ESPERA_ANTES_DE_CALCULAR_MS);

    return () => {
      clearTimeout(temporizador);
      cancelador.abort();
    };
  }, [edicion, puntos]);

  useEffect(() => {
    if (!aviso) {
      return;
    }

    const temporizador = setTimeout(() => setAviso(null), DURACION_AVISO_MS);
    return () => clearTimeout(temporizador);
  }, [aviso]);

  function cambiarPuntos(nuevos: PuntoClave[]) {
    setPuntos(nuevos);
    setSinGuardar(true);
    setOcupado("calculando");
    setEdicion((actual) => actual + 1);
  }

  function avisar(tipo: Aviso["tipo"], texto: string) {
    setAviso({ tipo, texto, id: Date.now() });
  }

  /** Un clic junto a la línea la corrige en ese tramo; lejos de todo, la extiende. */
  function agregarPunto(punto: Punto) {
    const indice = indiceDeInsercion(puntos, punto);
    cambiarPuntos([...puntos.slice(0, indice), { ...punto, recto: false }, ...puntos.slice(indice)]);
  }

  function moverPunto(indice: number, punto: Punto) {
    cambiarPuntos(puntos.map((actual, i) => (i === indice ? { ...actual, ...punto } : actual)));
  }

  function quitarPunto(indice: number) {
    cambiarPuntos(puntos.filter((_, i) => i !== indice));
  }

  function alternarRecto(indice: number) {
    cambiarPuntos(puntos.map((actual, i) => (i === indice ? { ...actual, recto: !actual.recto } : actual)));
  }

  /** Un trazado hecho a mano antes de los puntos clave se vuelve editable. */
  function convertirTrazadoViejo() {
    cambiarPuntos(simplificar(linea, TOLERANCIA_CONVERSION_M).map((p) => ({ ...p, recto: false })));
  }

  async function usarViaje(viaje: ViajeGrabado) {
    setOcupado("cargando_viaje");
    const recorrido = await cargarRecorridoDeViaje(viaje.id);
    const camino = recorrido.ok ? await caminoDesdeRecorrido(recorrido.gps) : recorrido;
    setOcupado("libre");

    if (!camino.ok) {
      avisar("error", camino.error);
      return;
    }

    setPuntos(camino.datos.puntos);
    setLinea(camino.datos.linea);
    setSinGuardar(true);
    setErrorCamino(null);
    avisar("exito", `Recorrido cargado con ${camino.datos.puntos.length} puntos. Revísalo y guárdalo.`);
  }

  /**
   * Vuelve a lo que estaba guardado. Llevar `edicion` a 0 cancela un cálculo de
   * camino en curso: el efecto solo recalcula después de un cambio del admin.
   */
  function descartar() {
    setPuntos([...puntosClaveIniciales]);
    setLinea([...trazadoInicial]);
    setEdicion(0);
    setSinGuardar(false);
    setOcupado("libre");
    setErrorCamino(null);
  }

  async function guardar() {
    setOcupado("guardando");
    const resultado = await guardarTrazadoDeRuta(rutaId, latLngATrazado(linea), puntos);
    setOcupado("libre");

    if (!resultado.ok) {
      avisar("error", resultado.error);
      return;
    }

    setSinGuardar(false);
    setParadasDeRuta(resultado.paradasDeRuta);
    avisar("exito", `Trazado guardado. La ruta pasa por ${resultado.paradasDeRuta.length} paradas.`);
  }

  return {
    puntos,
    linea,
    sinGuardar,
    ocupado,
    errorCamino,
    paradasDeRuta,
    aviso,
    agregarPunto,
    moverPunto,
    quitarPunto,
    alternarRecto,
    limpiar: () => cambiarPuntos([]),
    convertirTrazadoViejo,
    usarViaje,
    descartar,
    guardar,
    cerrarAviso: () => setAviso(null),
  };
}
