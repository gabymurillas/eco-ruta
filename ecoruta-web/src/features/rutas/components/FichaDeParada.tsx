"use client";

import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import type { useEditorDeRuta } from "../hooks/useEditorDeRuta";

type Editor = ReturnType<typeof useEditorDeRuta>;

type Props = {
  editor: Editor;
  radioMinimoM: number;
};

const RADIO_MAXIMO_M = 300;
const PASO_RADIO_M = 5;

/**
 * La parada que se está creando o editando. Nada se guarda hasta «Confirmar»:
 * mientras tanto el admin puede arrastrar el pin, tocar otro punto del mapa o
 * cambiar nombre y radio sin que la base cambie.
 */
export function FichaDeParada({ editor, radioMinimoM }: Props) {
  const { ficha, estadoFicha } = editor;

  if (!ficha) {
    return null;
  }

  const nueva = ficha.paradaId === null;

  return (
    <section
      aria-label={nueva ? "Nueva parada" : `Editar ${ficha.nombre}`}
      className="flex w-[340px] max-w-full flex-col gap-3 rounded-xl border-[0.5px] border-borde bg-superficie p-4"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-[15px] font-bold">
          {nueva ? "Nueva parada" : "Editar parada"}
        </h2>
        <span className="text-xs font-semibold text-tinta-suave">
          {nueva ? "Sin guardar" : editor.fichaConCambios ? "Cambios sin guardar" : "Guardada"}
        </span>
      </div>

      <p className="text-xs leading-relaxed text-tinta-media">
        Arrastra el pin o toca otro punto del mapa para moverla.
      </p>

      <Campo
        etiqueta="Nombre de la parada"
        id="nombre-parada"
        value={ficha.nombre}
        disabled={editor.ocupada}
        onChange={(evento) => editor.cambiarFicha({ nombre: evento.target.value })}
      />

      <label
        htmlFor="radio-geocerca"
        className="flex items-center justify-between text-xs font-bold tracking-wide text-tinta-suave"
      >
        Radio de geocerca
        <span className="font-serif text-[15px] font-black text-tinta">{ficha.radioM} m</span>
      </label>
      <input
        id="radio-geocerca"
        type="range"
        min={radioMinimoM}
        max={RADIO_MAXIMO_M}
        step={PASO_RADIO_M}
        value={ficha.radioM}
        disabled={editor.ocupada}
        onChange={(evento) => editor.cambiarFicha({ radioM: Number(evento.target.value) })}
        className="accent-marca-profundo"
      />
      <p className="text-xs leading-relaxed text-tinta-media">
        Mínimo {radioMinimoM} m: el doble de la exactitud medida del GPS. Con menos, la
        unidad pasaría sin que el sistema la detecte.
      </p>

      {estadoFicha.estado === "confirmando_eliminar" || estadoFicha.estado === "eliminando" ? (
        <ConfirmarEliminar editor={editor} nombre={ficha.nombre} />
      ) : (
        <Acciones editor={editor} nueva={nueva} />
      )}
    </section>
  );
}

function Acciones({ editor, nueva }: { editor: Editor; nueva: boolean }) {
  const { estadoFicha, problema } = editor;
  const guardando = estadoFicha.estado === "guardando";
  const fallo = estadoFicha.estado === "error";

  return (
    <div className="flex flex-col gap-2">
      {problema && (
        <p className="text-xs font-semibold text-advertencia-tinta">{problema}</p>
      )}
      {fallo && (
        <p role="alert" className="text-[13px] font-semibold text-error">
          {estadoFicha.mensaje} Tus datos siguen aquí.
        </p>
      )}

      <div className="flex gap-2">
        <Boton
          onClick={editor.confirmar}
          disabled={guardando || problema !== null || !editor.fichaConCambios}
          className="flex-1"
        >
          {guardando ? "Guardando…" : fallo ? "Reintentar" : nueva ? "Confirmar parada" : "Guardar cambios"}
        </Boton>
        <Boton variante="secundario" onClick={editor.cancelar} disabled={guardando}>
          {nueva || editor.fichaConCambios ? "Cancelar" : "Cerrar"}
        </Boton>
      </div>

      {!nueva && (
        <Boton
          variante="fantasma"
          onClick={editor.pedirEliminar}
          disabled={guardando}
          className="self-start px-3"
        >
          Eliminar parada
        </Boton>
      )}
    </div>
  );
}

function ConfirmarEliminar({ editor, nombre }: { editor: Editor; nombre: string }) {
  const { estadoFicha } = editor;
  const eliminando = estadoFicha.estado === "eliminando";
  const error = estadoFicha.estado === "confirmando_eliminar" ? estadoFicha.error : undefined;

  return (
    <div className="flex flex-col gap-2 rounded-[10px] border-[0.5px] border-error p-3">
      <p className="text-[13px] font-semibold">
        ¿Eliminar «{nombre}»? Los ciudadanos que la siguen dejarán de recibir avisos.
      </p>
      {error && (
        <p role="alert" className="text-[13px] font-semibold text-error">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={editor.confirmarEliminar}
          disabled={eliminando}
          className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-error px-5 text-[15px] font-bold text-superficie transition-[filter] duration-300 ease-out hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error disabled:opacity-50"
        >
          {eliminando ? "Eliminando…" : error ? "Reintentar" : "Sí, eliminar"}
        </button>
        <Boton variante="secundario" onClick={editor.noEliminar} disabled={eliminando}>
          No
        </Boton>
      </div>
    </div>
  );
}
