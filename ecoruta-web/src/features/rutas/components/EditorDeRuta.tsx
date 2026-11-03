"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { AvisoFlotante } from "@/components/ui/AvisoFlotante";
import { Boton } from "@/components/ui/Boton";
import { Tarjeta } from "@/components/ui/Tarjeta";
import type { Punto } from "@/domain/mapa";
import { useEditorDeRuta, type ParadaDeRuta } from "../hooks/useEditorDeRuta";
import type { ParadaEnMapa } from "./LienzoEditor";

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
  paradasDeRuta: readonly ParadaDeRuta[];
  /** Todas las de la ciudad: las que la ruta no toca se ven en gris. */
  paradasDeLaCiudad: readonly Omit<ParadaEnMapa, "orden">[];
};

export function EditorDeRuta({ rutaId, color, trazadoInicial, paradasDeRuta, paradasDeLaCiudad }: Props) {
  const editor = useEditorDeRuta({ rutaId, trazadoInicial, paradasDeRutaIniciales: paradasDeRuta });

  const orden = new Map(editor.paradasDeRuta.map((p) => [p.parada_id, p.orden]));
  const paradas = paradasDeLaCiudad.map((p) => ({ ...p, orden: orden.get(p.id) ?? null }));

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[13px] font-bold text-tinta-media">
          Haz clic en el mapa para ir marcando el recorrido, calle por calle.
        </span>
        <div className="ml-auto">
          <AvisoFlotante aviso={editor.aviso} alCerrar={editor.cerrarAviso} />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-5">
        <div className="min-w-0 flex-1 overflow-hidden rounded-2xl border-[0.5px] border-borde">
          <Lienzo color={color} trazado={editor.trazado} paradas={paradas} onClicEnMapa={editor.agregarPunto} />
        </div>

        <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto">
          <PanelTrazado editor={editor} />
          <ParadasQueToca paradas={editor.paradasDeRuta} sinGuardar={editor.sinGuardar} />
        </aside>
      </div>
    </div>
  );
}

type Editor = ReturnType<typeof useEditorDeRuta>;

function PanelTrazado({ editor }: { editor: Editor }) {
  return (
    <Tarjeta className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-[15px] font-bold">Trazado</h2>
        <span className="text-[13px] font-semibold text-tinta-media">{editor.trazado.length} puntos</span>
      </div>

      <p className="text-xs leading-relaxed text-tinta-media">
        El trazado decide por qué paradas pasa la ruta y permite calcular el tiempo estimado.
        No se guarda hasta que lo confirmes.
      </p>

      <div className="flex flex-col gap-2">
        <Boton variante="secundario" onClick={editor.deshacerUltimoPunto} disabled={editor.trazado.length === 0}>
          Deshacer último punto
        </Boton>
        <Boton variante="secundario" onClick={editor.limpiar} disabled={editor.trazado.length === 0}>
          Borrar todo
        </Boton>
        <Boton onClick={editor.guardar} disabled={editor.guardando || !editor.sinGuardar}>
          {editor.guardando ? "Guardando…" : "Guardar trazado"}
        </Boton>
      </div>
    </Tarjeta>
  );
}

function ParadasQueToca({ paradas, sinGuardar }: { paradas: readonly ParadaDeRuta[]; sinGuardar: boolean }) {
  return (
    <Tarjeta className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-[15px] font-bold">Paradas por donde pasa</h2>
        <span className="text-[13px] font-semibold text-tinta-media">{paradas.length}</span>
      </div>

      {sinGuardar && (
        <p className="text-xs font-semibold text-advertencia-tinta">
          Guarda el trazado para recalcular esta lista.
        </p>
      )}

      {paradas.length === 0 ? (
        <p className="text-xs leading-relaxed text-tinta-media">
          El trazado no pasa cerca de ninguna parada. Llévalo por las calles donde están, o
          agrega las paradas que faltan en{" "}
          <Link href="/admin/paradas" className="font-bold text-marca-profundo underline">
            Paradas
          </Link>
          .
        </p>
      ) : (
        <ol className="flex flex-col gap-1">
          {paradas.map((parada) => (
            <li key={parada.parada_id} className="flex items-center gap-3 px-1 py-1">
              <span className="w-5 text-xs font-bold text-tinta-suave">{parada.orden}</span>
              <span className="flex-1 truncate text-[13px] font-semibold">{parada.parada_nombre}</span>
            </li>
          ))}
        </ol>
      )}
    </Tarjeta>
  );
}
