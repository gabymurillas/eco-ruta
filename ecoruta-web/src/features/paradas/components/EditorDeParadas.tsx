"use client";

import dynamic from "next/dynamic";
import { AvisoFlotante } from "@/components/ui/AvisoFlotante";
import { BOTON_PANEL_PRINCIPAL, BOTON_PANEL_SECUNDARIO } from "@/components/ui/estilos-panel";
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
  /** Para el operador: ve el catálogo y cada parada en el mapa, sin poder cambiarlas. */
  soloLectura: boolean;
};

/**
 * El catálogo a la izquierda y el mapa al centro. El buscador y la ficha flotan
 * sobre el mapa: la parada se edita mirando la calle donde está, sin que el
 * mapa pierda ancho.
 */
export function EditorDeParadas({ trazados, soloLectura, ...datos }: Props) {
  const editor = useEditorDeParadas(datos);
  const cantidad = editor.paradas.length;

  return (
    <div className="flex h-dvh min-h-0 flex-col gap-4 p-6">
      <header className="flex flex-wrap items-center gap-x-3.5 gap-y-2">
        <h1 className="text-[26px] font-extrabold tracking-tight">Paradas</h1>
        <p className="text-sm text-tinta-media">
          {cantidad === 1 ? "1 parada" : `${cantidad} paradas`} en la ciudad · las rutas pasan por
          las que su trazado toca
        </p>
        <div className="ml-auto flex items-center gap-2.5">
          <AvisoFlotante aviso={editor.aviso} alCerrar={editor.cerrarAviso} />
          {editor.colocando && !editor.ficha && (
            <span className="text-[13px] font-bold text-tinta-media">Toca el mapa donde va la parada</span>
          )}
          {!soloLectura && (
          <button
            type="button"
            onClick={editor.colocando ? editor.cancelar : editor.empezarAColocar}
            aria-pressed={editor.colocando}
            disabled={editor.ocupada}
            className={editor.colocando ? BOTON_PANEL_SECUNDARIO : BOTON_PANEL_PRINCIPAL}
          >
            {editor.colocando ? "Cancelar" : (
              <>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Nueva parada
              </>
            )}
          </button>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 gap-4">
        <ListaDeParadas editor={editor} soloLectura={soloLectura} />

        <section
          aria-label="Mapa de paradas"
          className={`relative min-w-0 flex-1 overflow-hidden rounded-2xl border border-borde ${
            !soloLectura && (editor.colocando || editor.ficha) ? "[&_.leaflet-container]:cursor-crosshair" : ""
          }`}
        >
          <Lienzo
            paradas={editor.paradas}
            trazados={trazados}
            ficha={editor.ficha}
            destino={editor.destino}
            onClicEnMapa={soloLectura ? ignorar : editor.clicEnMapa}
            onSeleccionarParada={editor.seleccionarParada}
            onMoverFicha={soloLectura ? null : (punto) => editor.cambiarFicha(punto)}
          />

          {/* Sobre el mapa: Leaflet usa z-index hasta 1000 en sus controles. Va
              corrido a la derecha para no tapar los botones de zoom. */}
          {/* Elegir un lugar abre el borrador de una parada nueva: sin permiso, no va. */}
          {!soloLectura && (
            <div className="absolute top-4 left-16 z-[1000] w-[380px] max-w-[calc(100%-80px)]">
              <BuscadorDeLugares alElegir={editor.elegirLugar} />
            </div>
          )}

          {editor.ficha && (
            <div className="absolute top-4 right-4 z-[1000] max-h-[calc(100%-32px)] w-[340px] overflow-y-auto">
              <FichaDeParada editor={editor} radioMinimoM={datos.radioMinimoM} soloLectura={soloLectura} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ignorar() {}
