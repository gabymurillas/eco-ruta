"use client";

import dynamic from "next/dynamic";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { Tarjeta } from "@/components/ui/Tarjeta";
import type { Punto } from "@/domain/mapa";
import { useEditorDeRuta } from "../hooks/useEditorDeRuta";
import type { ParadaEditable } from "./LienzoEditor";

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
  exactitudMaximaM: number;
};

export function EditorDeRuta({
  rutaId,
  color,
  paradasIniciales,
  trazadoInicial,
  radioPorDefectoM,
  exactitudMaximaM,
}: Props) {
  const editor = useEditorDeRuta({
    rutaId,
    paradasIniciales,
    trazadoInicial,
    radioPorDefectoM,
  });

  return (
    <div className="flex h-full gap-5">
      <div className="min-w-0 flex-1 overflow-hidden rounded-2xl border-[0.5px] border-borde">
        <Lienzo
          color={color}
          paradas={editor.paradas}
          trazado={editor.trazado}
          modo={editor.modo}
          paradaSeleccionada={editor.seleccionada}
          onClicEnMapa={editor.clicEnMapa}
          onSeleccionarParada={editor.setSeleccionada}
          onMoverParada={editor.moverEnMapa}
        />
      </div>

      <aside className="flex w-86 shrink-0 flex-col gap-4 overflow-y-auto">
        <div
          role="group"
          aria-label="Qué estás editando"
          className="flex gap-1 rounded-full border-[0.5px] border-borde bg-superficie p-1"
        >
          <BotonModo
            activo={editor.modo === "paradas"}
            onClick={() => editor.setModo("paradas")}
          >
            Paradas
          </BotonModo>
          <BotonModo
            activo={editor.modo === "trazado"}
            onClick={() => editor.setModo("trazado")}
          >
            Trazado
          </BotonModo>
        </div>

        <Tarjeta tono="marca" className="flex flex-col gap-1">
          <span className="text-[13px] font-bold">
            {editor.modo === "paradas"
              ? "Haz clic en el mapa para colocar una parada"
              : "Haz clic para ir marcando el recorrido"}
          </span>
          <span className="text-xs leading-relaxed text-tinta-media">
            {editor.modo === "paradas"
              ? "Arrastra una parada para moverla. Selecciónala para ajustar su radio de geocerca."
              : "Los puntos se unen en el orden en que los marcas. El trazado no se guarda hasta que lo confirmes."}
          </span>
        </Tarjeta>

        {editor.error && (
          <p role="alert" className="text-[13px] font-semibold text-error">
            {editor.error}
          </p>
        )}

        {editor.modo === "trazado" ? (
          <PanelTrazado editor={editor} />
        ) : (
          <PanelParadas editor={editor} exactitudMaximaM={exactitudMaximaM} />
        )}
      </aside>
    </div>
  );
}

type Editor = ReturnType<typeof useEditorDeRuta>;

function PanelTrazado({ editor }: { editor: Editor }) {
  return (
    <Tarjeta className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <span className="font-serif text-[15px] font-bold">Trazado</span>
        <span className="text-[13px] font-semibold text-tinta-media">
          {editor.trazado.length} puntos
        </span>
      </div>

      <p className="text-xs leading-relaxed text-tinta-media">
        Sin trazado no hay tiempo estimado: la distancia no puede seguir el recorrido
        real y en línea recta lo subestimaría siempre.
      </p>

      <div className="flex flex-col gap-2">
        <Boton
          variante="secundario"
          onClick={editor.deshacerUltimoPunto}
          disabled={editor.trazado.length === 0}
        >
          Deshacer último punto
        </Boton>

        <Boton
          variante="secundario"
          onClick={editor.limpiarTrazado}
          disabled={editor.trazado.length === 0}
        >
          Borrar todo
        </Boton>

        <Boton
          onClick={editor.guardarTrazadoActual}
          disabled={editor.guardando || !editor.trazadoSinGuardar}
        >
          {editor.guardando ? "Guardando…" : "Guardar trazado"}
        </Boton>
      </div>
    </Tarjeta>
  );
}

function PanelParadas({
  editor,
  exactitudMaximaM,
}: {
  editor: Editor;
  exactitudMaximaM: number;
}) {
  const parada = editor.paradaSeleccionada;

  return (
    <>
      <Tarjeta className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <span className="font-serif text-[15px] font-bold">Paradas</span>
          <span className="text-[13px] font-semibold text-tinta-media">
            {editor.paradas.length}
          </span>
        </div>

        {editor.paradas.length === 0 ? (
          <p className="text-xs leading-relaxed text-tinta-media">
            Todavía no hay paradas. Haz clic en el mapa para colocar la primera.
          </p>
        ) : (
          <ul className="flex flex-col">
            {editor.paradas.map((p, indice) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => editor.setSeleccionada(p.id)}
                  aria-pressed={p.id === editor.seleccionada}
                  className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors duration-300 ease-out hover:bg-marca-tenue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo ${
                    p.id === editor.seleccionada ? "bg-marca-tenue" : ""
                  }`}
                >
                  <span className="w-5 text-xs font-bold text-tinta-suave">
                    {indice + 1}
                  </span>
                  <span className="flex-1 truncate text-[13px] font-semibold">
                    {p.nombre}
                  </span>
                  <span className="text-xs font-semibold text-tinta-media">
                    {p.radioM} m
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>

      {parada && (
        <Tarjeta className="flex flex-col gap-3">
          <Campo
            etiqueta="Nombre de la parada"
            id="nombre-parada"
            value={parada.nombre}
            onChange={(evento) => editor.cambiarNombre(parada.id, evento.target.value)}
            onBlur={() => editor.confirmarNombre(parada.id)}
          />

          <label
            htmlFor="radio-geocerca"
            className="flex items-center justify-between text-xs font-bold tracking-wide text-tinta-suave"
          >
            Radio de geocerca
            <span className="font-serif text-[15px] font-black text-tinta">
              {parada.radioM} m
            </span>
          </label>

          <input
            id="radio-geocerca"
            type="range"
            min={exactitudMaximaM}
            max={300}
            step={5}
            value={parada.radioM}
            onChange={(evento) => editor.cambiarRadio(Number(evento.target.value))}
            onPointerUp={editor.confirmarRadio}
            onKeyUp={editor.confirmarRadio}
            className="accent-marca-profundo"
          />

          <p className="text-xs leading-relaxed text-tinta-media">
            El mínimo del deslizador es la exactitud medida del GPS ({exactitudMaximaM} m).
            Un radio menor no se dispararía nunca.
          </p>

          <Boton
            variante="secundario"
            onClick={() => editor.quitarParada(parada.id)}
            disabled={editor.guardando}
          >
            Eliminar parada
          </Boton>
        </Tarjeta>
      )}
    </>
  );
}

function BotonModo({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: string;
}) {
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
