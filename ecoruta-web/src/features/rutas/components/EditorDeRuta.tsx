"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { AvisoFlotante } from "@/components/ui/AvisoFlotante";
import { BOTON_PANEL_PRINCIPAL, BOTON_PANEL_SECUNDARIO } from "@/components/ui/estilos-panel";
import { colorDeRuta } from "@/domain/colores";
import type { Punto } from "@/domain/mapa";
import {
  useEditorDeRuta,
  type ParadaDeRuta,
  type PuntoClave,
  type ViajeGrabado,
} from "../hooks/useEditorDeRuta";
import { useAvisoAntesDeSalir } from "../hooks/useAvisoAntesDeSalir";
import type { ParadaEnMapa } from "./LienzoEditor";
import { PanelLateralTrazado } from "./PanelLateralTrazado";

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
  rutaNombre: string;
  color: string | null;
  trazadoInicial: readonly Punto[];
  puntosClave: readonly PuntoClave[];
  paradasDeRuta: readonly ParadaDeRuta[];
  /** Todas las de la ciudad: las que la ruta no toca se ven en gris. */
  paradasDeLaCiudad: readonly Omit<ParadaEnMapa, "orden">[];
  viajes: readonly ViajeGrabado[];
  /** `distancia_parada_trazado_m`: hasta dónde una parada cuenta como tocada. */
  distanciaParadaM: number;
};

export type Editor = ReturnType<typeof useEditorDeRuta>;

export function EditorDeRuta(props: Props) {
  const editor = useEditorDeRuta({
    rutaId: props.rutaId,
    trazadoInicial: props.trazadoInicial,
    puntosClaveIniciales: props.puntosClave,
    paradasDeRutaIniciales: props.paradasDeRuta,
  });
  const [modo, setModo] = useState<"puntos" | "viaje">("puntos");
  useAvisoAntesDeSalir(editor.sinGuardar);

  const orden = new Map(editor.paradasDeRuta.map((p) => [p.parada_id, p.orden]));
  const paradas = props.paradasDeLaCiudad.map((p) => ({ ...p, orden: orden.get(p.id) ?? null }));

  return (
    <div className="flex h-dvh min-h-0 flex-col gap-4 p-6">
      <Encabezado {...props} editor={editor} />

      <div className="flex min-h-0 flex-1 gap-4">
        <section
          aria-label="Mapa del trazado"
          className="relative min-w-0 flex-1 overflow-hidden rounded-2xl border border-borde"
        >
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
          <AyudaDelMapa editor={editor} />
        </section>

        <PanelLateralTrazado
          editor={editor}
          modo={modo}
          alCambiarModo={setModo}
          viajes={props.viajes}
          color={props.color}
          distanciaParadaM={props.distanciaParadaM}
        />
      </div>
    </div>
  );
}

function Encabezado({ rutaId, rutaNombre, color, editor }: Props & { editor: Editor }) {
  const puedeGuardar =
    editor.sinGuardar && editor.ocupado === "libre" && !editor.errorCamino && editor.puntos.length !== 1;

  return (
    <header className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <nav aria-label="Ruta de navegación" className="flex items-center gap-1.5 text-[13px] text-tinta-media">
          <Link href="/admin/rutas" className="font-semibold hover:text-tinta hover:underline">
            Rutas
          </Link>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
          <span className="inline-flex items-center gap-1.5 font-semibold text-tinta">
            <i aria-hidden="true" className="size-2.5 rounded-full" style={{ backgroundColor: colorDeRuta(color) }} />
            {rutaNombre}
          </span>
        </nav>
        <h1 className="text-[24px] font-extrabold tracking-tight">Trazado y paradas</h1>
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-2.5">
        <AvisoFlotante aviso={editor.aviso} alCerrar={editor.cerrarAviso} />
        {editor.sinGuardar && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-borde bg-superficie px-3 py-1 text-[13px] font-bold">
            <svg width="11" height="11" viewBox="0 0 24 24" className="text-advertencia" aria-hidden="true">
              <path d="M12 2L23 21H1z" fill="currentColor" />
            </svg>
            Hay cambios sin guardar
          </span>
        )}
        {editor.sinGuardar ? (
          <button type="button" onClick={editor.descartar} disabled={editor.ocupado === "guardando"} className={BOTON_PANEL_SECUNDARIO}>
            Descartar
          </button>
        ) : (
          <Link href={`/admin/rutas/${rutaId}/datos`} className={BOTON_PANEL_SECUNDARIO}>
            Datos de la ruta
          </Link>
        )}
        <button type="button" onClick={editor.guardar} disabled={!puedeGuardar} className={BOTON_PANEL_PRINCIPAL}>
          {editor.ocupado === "guardando" ? "Guardando…" : "Guardar trazado"}
        </button>
      </div>
    </header>
  );
}

/** Lo que está pasando con el camino, sobre el mapa, donde el admin está mirando. */
function AyudaDelMapa({ editor }: { editor: Editor }) {
  const textos = {
    calculando: "Calculando el camino por las calles…",
    cargando_viaje: "Sacando el trazado del viaje…",
    guardando: "Guardando…",
    libre: "Toca el mapa para agregar un punto. Arrastra un punto para moverlo.",
  };
  const error = editor.errorCamino;

  return (
    <p
      role={error ? "alert" : "status"}
      className={`absolute bottom-3.5 left-3.5 z-[1000] flex max-w-[calc(100%-28px)] items-center gap-2 rounded-[10px] border bg-superficie px-3 py-2 text-[13px] font-semibold ${
        error ? "border-error text-error" : "border-borde"
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={error ? "" : "text-tinta-media"} aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8v.1" />
      </svg>
      {error ?? textos[editor.ocupado]}
    </p>
  );
}
