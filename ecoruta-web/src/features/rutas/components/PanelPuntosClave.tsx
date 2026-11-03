"use client";

import Link from "next/link";
import { Boton } from "@/components/ui/Boton";
import { Tarjeta } from "@/components/ui/Tarjeta";
import type { ParadaDeRuta, useEditorDeRuta } from "../hooks/useEditorDeRuta";

type Editor = ReturnType<typeof useEditorDeRuta>;

export function PanelPuntosClave({ editor }: { editor: Editor }) {
  const trazadoViejo = editor.puntos.length === 0 && editor.linea.length >= 2;

  return (
    <Tarjeta className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-[15px] font-bold">Puntos clave</h2>
        <span className="text-[13px] font-semibold text-tinta-media">{editor.puntos.length}</span>
      </div>

      <ol className="flex list-decimal flex-col gap-1.5 pl-4 text-xs leading-relaxed text-tinta-media">
        <li>Toca el inicio y el final de la ruta: el camino se dibuja solo por las calles.</li>
        <li>Si no va por donde debe, toca la calle correcta: el punto se mete en ese tramo.</li>
        <li>Arrastra un punto para moverlo, o tócalo para quitarlo o llegar a él en línea recta.</li>
      </ol>

      {trazadoViejo && (
        <div className="flex flex-col gap-2 rounded-[10px] border-[0.5px] border-advertencia-borde bg-advertencia-fondo p-3">
          <p className="text-xs leading-relaxed text-advertencia-tinta">
            Este trazado se dibujó a mano y no tiene puntos clave. Conviértelo para poder editarlo
            moviendo puntos.
          </p>
          <Boton variante="secundario" onClick={editor.convertirTrazadoViejo}>
            Convertir a puntos clave
          </Boton>
        </div>
      )}

      <Boton
        variante="secundario"
        onClick={editor.limpiar}
        disabled={editor.puntos.length === 0 || editor.ocupado !== "libre"}
      >
        Empezar de nuevo
      </Boton>
    </Tarjeta>
  );
}

export function ParadasQueToca({ paradas, sinGuardar }: { paradas: readonly ParadaDeRuta[]; sinGuardar: boolean }) {
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
          agrega las que faltan en{" "}
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
