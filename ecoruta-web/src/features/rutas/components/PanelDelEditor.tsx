"use client";

import { Boton } from "@/components/ui/Boton";
import { Tarjeta } from "@/components/ui/Tarjeta";
import type { useEditorDeRuta } from "../hooks/useEditorDeRuta";

type Editor = ReturnType<typeof useEditorDeRuta>;

/** Lo que acompaña al mapa: qué se edita, la lista de paradas y el trazado. */
export function PanelDelEditor({ editor }: { editor: Editor }) {
  return (
    <>
      <div
        role="group"
        aria-label="Qué estás editando"
        className="flex gap-1 rounded-full border-[0.5px] border-borde bg-superficie p-1"
      >
        <BotonModo activo={editor.modo === "paradas"} onClick={() => editor.setModo("paradas")}>
          Paradas
        </BotonModo>
        <BotonModo activo={editor.modo === "trazado"} onClick={() => editor.setModo("trazado")}>
          Trazado
        </BotonModo>
      </div>

      <Tarjeta tono="marca" className="flex flex-col gap-1">
        <span className="text-[13px] font-bold">
          {editor.modo === "paradas"
            ? "Busca el lugar o toca «Agregar parada»"
            : "Haz clic para ir marcando el recorrido"}
        </span>
        <span className="text-xs leading-relaxed text-tinta-media">
          {editor.modo === "paradas"
            ? "La parada queda como borrador hasta que la confirmes. Toca una parada del mapa o de la lista para editarla."
            : "Los puntos se unen en el orden en que los marcas. El trazado no se guarda hasta que lo confirmes."}
        </span>
      </Tarjeta>

      {editor.modo === "trazado" ? <PanelTrazado editor={editor} /> : <ListaParadas editor={editor} />}
    </>
  );
}

function ListaParadas({ editor }: { editor: Editor }) {
  return (
    <Tarjeta className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <span className="font-serif text-[15px] font-bold">Paradas</span>
        <span className="text-[13px] font-semibold text-tinta-media">{editor.paradas.length}</span>
      </div>

      {editor.paradas.length === 0 ? (
        <p className="text-xs leading-relaxed text-tinta-media">
          Todavía no hay paradas. Busca un lugar o toca «Agregar parada» para colocar la primera.
        </p>
      ) : (
        <ul className="flex flex-col">
          {editor.paradas.map((parada, indice) => {
            const abierta = parada.id === editor.ficha?.paradaId;

            return (
              <li key={parada.id}>
                <button
                  type="button"
                  onClick={() => editor.seleccionarParada(parada.id)}
                  aria-pressed={abierta}
                  className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors duration-300 ease-out hover:bg-marca-tenue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo ${
                    abierta ? "bg-marca-tenue" : ""
                  }`}
                >
                  <span className="w-5 text-xs font-bold text-tinta-suave">{indice + 1}</span>
                  <span className="flex-1 truncate text-[13px] font-semibold">{parada.nombre}</span>
                  <span className="text-xs font-semibold text-tinta-media">{parada.radioM} m</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Tarjeta>
  );
}

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
        Sin trazado no hay tiempo estimado: la distancia no puede seguir el recorrido real y en
        línea recta lo subestimaría siempre.
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
          disabled={editor.guardandoTrazado || !editor.trazadoSinGuardar}
        >
          {editor.guardandoTrazado ? "Guardando…" : "Guardar trazado"}
        </Boton>
      </div>
    </Tarjeta>
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
