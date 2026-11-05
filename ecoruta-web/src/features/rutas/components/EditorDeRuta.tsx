"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { AvisoFlotante } from "@/components/ui/AvisoFlotante";
import { Boton } from "@/components/ui/Boton";
import type { Punto } from "@/domain/mapa";
import {
  useEditorDeRuta,
  type ParadaDeRuta,
  type PuntoClave,
  type ViajeGrabado,
} from "../hooks/useEditorDeRuta";
import { useAvisoAntesDeSalir } from "../hooks/useAvisoAntesDeSalir";
import type { ParadaEnMapa } from "./LienzoEditor";
import { PanelPuntosClave, ParadasQueToca } from "./PanelPuntosClave";
import { PanelViajes } from "./PanelViajes";

/** Leaflet toca `window` al importarse: el lienzo queda fuera del render del servidor. */
const Lienzo = dynamic(
  () => import("./LienzoEditor").then((modulo) => modulo.LienzoEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex size-full items-center justify-center bg-fondo">
        <p className="text-sm text-tinta-media">Cargando el mapa…</p>
      </div>
    ),
  },
);

type Props = {
  rutaId: string;
  color: string | null;
  trazadoInicial: readonly Punto[];
  puntosClave: readonly PuntoClave[];
  paradasDeRuta: readonly ParadaDeRuta[];
  /** Todas las de la ciudad: las que la ruta no toca se ven en gris. */
  paradasDeLaCiudad: readonly Omit<ParadaEnMapa, "orden">[];
  viajes: readonly ViajeGrabado[];
};

type Modo = "puntos" | "viaje";

export function EditorDeRuta(props: Props) {
  const editor = useEditorDeRuta({
    rutaId: props.rutaId,
    trazadoInicial: props.trazadoInicial,
    puntosClaveIniciales: props.puntosClave,
    paradasDeRutaIniciales: props.paradasDeRuta,
  });
  const [modo, setModo] = useState<Modo>("puntos");
  useAvisoAntesDeSalir(editor.sinGuardar);

  const orden = new Map(editor.paradasDeRuta.map((p) => [p.parada_id, p.orden]));
  const paradas = props.paradasDeLaCiudad.map((p) => ({ ...p, orden: orden.get(p.id) ?? null }));
  const puedeGuardar =
    editor.sinGuardar && editor.ocupado === "libre" && !editor.errorCamino && editor.puntos.length !== 1;

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <EstadoDelTrazado editor={editor} />
        <div className="ml-auto flex items-center gap-3">
          <AvisoFlotante aviso={editor.aviso} alCerrar={editor.cerrarAviso} />
          <Boton onClick={editor.guardar} disabled={!puedeGuardar}>
            {editor.ocupado === "guardando" ? "Guardando…" : "Guardar trazado"}
          </Boton>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-5">
        <div className="min-w-0 flex-1 overflow-hidden rounded-2xl border-[0.5px] border-borde">
          <Lienzo
            color={props.color}
            linea={editor.linea}
            puntos={editor.puntos}
            paradas={paradas}
            onClicEnMapa={editor.agregarPunto}
            onMoverPunto={editor.moverPunto}
            onQuitarPunto={editor.quitarPunto}
            onAlternarRecto={editor.alternarRecto}
          />
        </div>

        <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto">
          <div
            role="group"
            aria-label="Cómo armar el trazado"
            className="flex gap-1 rounded-full border-[0.5px] border-borde bg-superficie p-1"
          >
            <BotonModo activo={modo === "puntos"} onClick={() => setModo("puntos")}>
              Puntos clave
            </BotonModo>
            <BotonModo activo={modo === "viaje"} onClick={() => setModo("viaje")}>
              Desde un viaje
            </BotonModo>
          </div>

          {modo === "puntos" ? (
            <PanelPuntosClave editor={editor} />
          ) : (
            <PanelViajes viajes={props.viajes} editor={editor} alUsar={() => setModo("puntos")} />
          )}

          <ParadasQueToca paradas={editor.paradasDeRuta} sinGuardar={editor.sinGuardar} />
        </aside>
      </div>
    </div>
  );
}

function EstadoDelTrazado({ editor }: { editor: ReturnType<typeof useEditorDeRuta> }) {
  if (editor.errorCamino) {
    return (
      <p role="alert" className="text-[13px] font-semibold text-error">
        {editor.errorCamino}
      </p>
    );
  }

  const textos = {
    calculando: "Calculando el camino por las calles…",
    cargando_viaje: "Sacando el trazado del viaje…",
    guardando: "Guardando…",
    libre: editor.sinGuardar ? "Hay cambios sin guardar." : "Toca el mapa para agregar un punto. Arrastra un punto para moverlo.",
  };

  return (
    <p role="status" className="text-[13px] font-bold text-tinta-media">
      {textos[editor.ocupado]}
    </p>
  );
}

function BotonModo({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`h-9 flex-1 rounded-full text-[13px] font-bold transition-colors duration-300 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo ${
        activo ? "bg-marca-profundo text-superficie" : "text-tinta-media hover:bg-marca-tenue"
      }`}
    >
      {children}
    </button>
  );
}
