"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Boton } from "@/components/ui/Boton";
import type { Punto } from "@/domain/mapa";
import { useEditorDeRuta } from "../hooks/useEditorDeRuta";
import { AvisoDelEditor } from "./AvisoDelEditor";
import { BuscadorDeLugares } from "./BuscadorDeLugares";
import { FichaDeParada } from "./FichaDeParada";
import type { ParadaEditable } from "./LienzoEditor";
import { PanelDelEditor } from "./PanelDelEditor";

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
  paradasIniciales: readonly ParadaEditable[];
  trazadoInicial: readonly Punto[];
  radioPorDefectoM: number;
  radioMinimoM: number;
};

/**
 * El mapa es el contenido: ocupa todo el espacio, y el buscador, la ficha y los
 * avisos flotan encima. El panel con la lista se pliega para dejarle más lugar.
 */
export function EditorDeRuta({ color, radioMinimoM, ...datos }: Props) {
  const editor = useEditorDeRuta({ ...datos, radioMinimoM });
  const [panelAbierto, setPanelAbierto] = useState(true);

  return (
    <div className="flex h-full gap-5">
      <div
        className={`relative min-w-0 flex-1 overflow-hidden rounded-2xl border-[0.5px] border-borde [&_.leaflet-top.leaflet-left]:top-16 ${
          editor.colocando ? "[&_.leaflet-container]:cursor-crosshair" : ""
        }`}
      >
        <Lienzo
          color={color}
          paradas={editor.paradas}
          trazado={editor.trazado}
          modo={editor.modo}
          ficha={editor.ficha}
          destino={editor.destino}
          onClicEnMapa={editor.clicEnMapa}
          onSeleccionarParada={editor.seleccionarParada}
          onMoverFicha={(punto) => editor.cambiarFicha(punto)}
        />

        {/* Leaflet apila sus capas hasta z-index 1000: lo que flota va por encima. */}
        <div className="pointer-events-none absolute inset-x-4 top-4 z-[1100] flex flex-wrap items-start gap-3">
          <div className="pointer-events-auto flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {editor.modo === "paradas" && (
              <>
                <BuscadorDeLugares alElegir={editor.elegirLugar} />
                <Boton
                  variante={editor.colocando ? "primario" : "secundario"}
                  onClick={editor.colocando ? editor.cancelar : editor.empezarAColocar}
                  aria-pressed={editor.colocando}
                  disabled={editor.ocupada}
                >
                  {editor.colocando ? "Cancelar" : "Agregar parada"}
                </Boton>
              </>
            )}
          </div>

          <Boton
            variante="secundario"
            onClick={() => setPanelAbierto((abierto) => !abierto)}
            aria-expanded={panelAbierto}
            aria-controls="panel-editor"
            className="pointer-events-auto"
          >
            {panelAbierto ? "Ocultar panel" : "Mostrar panel"}
          </Boton>
        </div>

        {editor.colocando && (
          <p className="pointer-events-none absolute inset-x-0 top-20 z-[1100] mx-auto w-fit rounded-full border-[0.5px] border-borde bg-superficie px-4 py-2 text-[13px] font-bold">
            Toca el mapa donde va la parada
          </p>
        )}

        <div className="pointer-events-none absolute inset-x-4 bottom-4 z-[1100] flex flex-col items-start gap-3">
          <div className="pointer-events-auto">
            <FichaDeParada editor={editor} radioMinimoM={radioMinimoM} />
          </div>
          <div className="self-stretch">
            <AvisoDelEditor aviso={editor.aviso} alCerrar={editor.cerrarAviso} />
          </div>
        </div>
      </div>

      {panelAbierto && (
        <aside id="panel-editor" className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto">
          <PanelDelEditor editor={editor} />
        </aside>
      )}
    </div>
  );
}
