"use client";

import Link from "next/link";
import { BOTON_PANEL_SECUNDARIO } from "@/components/ui/estilos-panel";
import { colorDeRuta, tintaSobreColorDeRuta } from "@/domain/colores";
import { formatearDistancia } from "@/domain/formato";
import { longitudM } from "@/domain/trazado";
import type { ViajeGrabado } from "../hooks/useEditorDeRuta";
import type { Editor } from "./EditorDeRuta";
import { ListaPuntosClave } from "./ListaPuntosClave";
import { PanelViajes } from "./PanelViajes";

type Modo = "puntos" | "viaje";

type Props = {
  editor: Editor;
  modo: Modo;
  alCambiarModo: (modo: Modo) => void;
  viajes: readonly ViajeGrabado[];
  color: string | null;
  distanciaParadaM: number;
};

export function PanelLateralTrazado({ editor, modo, alCambiarModo, viajes, color, distanciaParadaM }: Props) {
  return (
    <aside className="flex w-[400px] shrink-0 flex-col gap-4 overflow-y-auto rounded-2xl border border-borde bg-superficie p-4">
      <div role="group" aria-label="Cómo armar el trazado" className="flex rounded-[11px] border border-borde bg-fondo p-0.5">
        <BotonModo activo={modo === "puntos"} onClick={() => alCambiarModo("puntos")}>Puntos clave</BotonModo>
        <BotonModo activo={modo === "viaje"} onClick={() => alCambiarModo("viaje")}>Desde un viaje grabado</BotonModo>
      </div>

      <dl className="grid grid-cols-3 gap-2">
        <Total valor={editor.linea.length >= 2 ? formatearDistancia(longitudM(editor.linea)) : "—"} texto="recorrido" />
        <Total valor={String(editor.puntos.length)} texto="puntos clave" />
        <Total valor={editor.sinGuardar ? "—" : String(editor.paradasDeRuta.length)} texto="paradas que toca" />
      </dl>

      {modo === "puntos" ? (
        <SeccionPuntos editor={editor} color={color} />
      ) : (
        <PanelViajes viajes={viajes} editor={editor} alUsar={() => alCambiarModo("puntos")} />
      )}

      <ParadasQueToca editor={editor} color={color} distanciaParadaM={distanciaParadaM} />
    </aside>
  );
}

function SeccionPuntos({ editor, color }: { editor: Editor; color: string | null }) {
  const trazadoViejo = editor.puntos.length === 0 && editor.linea.length >= 2;

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-extrabold">Puntos clave</h2>

      {trazadoViejo ? (
        <div className="flex flex-col gap-2 rounded-[10px] border border-borde bg-fondo p-3 text-[13px]">
          <p>
            Este trazado se dibujó a mano y no tiene puntos clave. Conviértelo para editarlo
            moviendo puntos.
          </p>
          <button type="button" onClick={editor.convertirTrazadoViejo} className={`${BOTON_PANEL_SECUNDARIO} self-start`}>
            Convertir a puntos clave
          </button>
        </div>
      ) : editor.puntos.length === 0 ? (
        <p className="text-[13px] text-tinta-media">
          Toca en el mapa el inicio y el final de la ruta: el camino se dibuja solo por las calles.
          Si no va por donde debe, toca la calle correcta y el punto se mete en ese tramo.
        </p>
      ) : (
        <>
          <ListaPuntosClave puntos={editor.puntos} linea={editor.linea} color={color} />
          <p className="text-[12.5px] text-tinta-media">
            Toca un punto en el mapa para quitarlo o para que llegue a él en línea recta.
          </p>
          <button
            type="button"
            onClick={editor.limpiar}
            disabled={editor.ocupado !== "libre"}
            className={`${BOTON_PANEL_SECUNDARIO} self-start`}
          >
            Empezar de nuevo
          </button>
        </>
      )}
    </section>
  );
}

function ParadasQueToca({ editor, color, distanciaParadaM }: { editor: Editor; color: string | null; distanciaParadaM: number }) {
  const paradas = editor.paradasDeRuta;

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-extrabold">
        Paradas que toca{" "}
        <span className="text-[12.5px] font-medium text-tinta-media">a menos de {distanciaParadaM} m del trazado</span>
      </h2>

      {editor.sinGuardar && (
        <p className="text-[12.5px] font-semibold text-tinta-media">
          Es la lista del trazado guardado. Guarda los cambios para recalcularla.
        </p>
      )}

      {paradas.length === 0 ? (
        <p className="text-[13px] text-tinta-media">
          El trazado no pasa cerca de ninguna parada. Llévalo por las calles donde están, o agrega
          las que faltan en{" "}
          <Link href="/admin/paradas" className="font-semibold text-tinta underline">Paradas</Link>.
        </p>
      ) : (
        <ol className="flex flex-wrap gap-1.5">
          {paradas.map((parada) => (
            <li key={parada.parada_id} className="flex items-center gap-1.5 rounded-full border border-borde py-1 pr-2.5 pl-1 text-[13px] font-semibold">
              <span
                className="grid size-5 place-items-center rounded-full text-[11px] font-extrabold"
                style={{ backgroundColor: colorDeRuta(color), color: tintaSobreColorDeRuta(color) }}
              >
                {parada.orden}
              </span>
              {parada.parada_nombre}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function Total({ valor, texto }: { valor: string; texto: string }) {
  return (
    <div className="flex flex-col-reverse rounded-[10px] bg-fondo px-2.5 py-2">
      <dt className="text-[12.5px] text-tinta-media">{texto}</dt>
      <dd className="text-[17px] font-bold">{valor}</dd>
    </div>
  );
}

function BotonModo({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`h-9 flex-1 rounded-[9px] text-[13px] font-bold transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo ${
        activo ? "border border-borde bg-superficie text-tinta" : "text-tinta-media hover:text-tinta"
      }`}
    >
      {children}
    </button>
  );
}
