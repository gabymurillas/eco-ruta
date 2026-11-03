"use client";

import dynamic from "next/dynamic";
import { AvisoFlotante } from "@/components/ui/AvisoFlotante";
import { Boton } from "@/components/ui/Boton";
import { useEditorDeParadas, type ParadaDeLaCiudad } from "../hooks/useEditorDeParadas";
import { BuscadorDeLugares } from "./BuscadorDeLugares";
import { FichaDeParada } from "./FichaDeParada";
import type { TrazadoVisible } from "./LienzoParadas";
import { ListaDeParadas } from "./ListaDeParadas";

/** Leaflet toca `window` al importarse: el lienzo queda fuera del render del servidor. */
const Lienzo = dynamic(
  () => import("./LienzoParadas").then((modulo) => modulo.LienzoParadas),
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
  paradas: readonly ParadaDeLaCiudad[];
  trazados: readonly TrazadoVisible[];
  radioPorDefectoM: number;
  radioMinimoM: number;
};

/**
 * El mapa ocupa todo lo que puede y nada flota encima de él: el buscador y los
 * avisos van en la barra de arriba, y la ficha de la parada en el panel.
 */
export function EditorDeParadas({ trazados, ...datos }: Props) {
  const editor = useEditorDeParadas(datos);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <BuscadorDeLugares alElegir={editor.elegirLugar} />
        <Boton
          variante={editor.colocando ? "primario" : "secundario"}
          onClick={editor.colocando ? editor.cancelar : editor.empezarAColocar}
          aria-pressed={editor.colocando}
          disabled={editor.ocupada}
        >
          {editor.colocando ? "Cancelar" : "Agregar parada"}
        </Boton>
        {editor.colocando && (
          <span className="text-[13px] font-bold text-tinta-media">
            Toca el mapa donde va la parada
          </span>
        )}
        <div className="ml-auto">
          <AvisoFlotante aviso={editor.aviso} alCerrar={editor.cerrarAviso} />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-5">
        <div
          className={`min-w-0 flex-1 overflow-hidden rounded-2xl border-[0.5px] border-borde ${
            editor.colocando || editor.ficha ? "[&_.leaflet-container]:cursor-crosshair" : ""
          }`}
        >
          <Lienzo
            paradas={editor.paradas}
            trazados={trazados}
            ficha={editor.ficha}
            destino={editor.destino}
            onClicEnMapa={editor.clicEnMapa}
            onSeleccionarParada={editor.seleccionarParada}
            onMoverFicha={(punto) => editor.cambiarFicha(punto)}
          />
        </div>

        <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto">
          {editor.ficha ? (
            <FichaDeParada editor={editor} radioMinimoM={datos.radioMinimoM} />
          ) : (
            <ListaDeParadas editor={editor} />
          )}
        </aside>
      </div>
    </div>
  );
}
