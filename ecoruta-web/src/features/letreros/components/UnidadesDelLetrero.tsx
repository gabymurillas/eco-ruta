"use client";

import { useActionState, useEffect, useRef } from "react";
import { IconoRuta } from "@/components/ui/IconoRuta";
import { BOTON_PANEL_PRINCIPAL, BOTON_PANEL_SECUNDARIO } from "@/components/ui/estilos-panel";
import { colorDeRuta, tintaSobreColorDeRuta } from "@/domain/colores";
import type { Letrero } from "@/services/letreros.service";
import { guardarUnidades, type EstadoLetreros } from "../acciones";

export type OpcionDeUnidad = {
  id: string;
  nombre: string;
  activa: boolean;
  rutaNombre: string | null;
  rutaColor: string | null;
  rutaIcono: string | null;
};

type Props = {
  letrero: Letrero;
  unidades: readonly OpcionDeUnidad[];
  onCancelar: () => void;
  onGuardado: () => void;
};

const ESTADO_INICIAL: EstadoLetreros = {};

export function UnidadesDelLetrero({ letrero, unidades, onCancelar, onGuardado }: Props) {
  const [estado, enviar, enviando] = useActionState(
    async (previo: EstadoLetreros, datos: FormData) => {
      const resultado = await guardarUnidades(previo, datos);
      if (resultado.guardado) {
        onGuardado();
      }
      return resultado;
    },
    ESTADO_INICIAL,
  );
  const titulo = useRef<HTMLHeadingElement>(null);
  const asignadas = new Set(letrero.unidadIds);

  // El panel se abre lejos del botón que lo pidió: el foco tiene que ir con él.
  useEffect(() => {
    titulo.current?.focus();
  }, []);

  return (
    <section aria-labelledby="titulo-unidades-letrero" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2
          ref={titulo}
          id="titulo-unidades-letrero"
          tabIndex={-1}
          className="text-[19px] leading-tight font-extrabold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo"
        >
          Unidades que pueden usarlo
        </h2>
        <p className="text-[13px] leading-relaxed text-tinta-media">
          «{letrero.nombre}» aparecerá entre las opciones de la app solo en las unidades que
          marques. Si quitas una que lo tenía elegido, vuelve al nombre normal.
        </p>
      </div>

      <form action={enviar} className="flex flex-col gap-4">
        <input type="hidden" name="letreroId" value={letrero.id} />

        {unidades.length === 0 ? (
          <p className="text-[13px] text-tinta-media">Todavía no hay unidades. Créalas en «Unidades».</p>
        ) : (
          <fieldset className="flex flex-col gap-1">
            <legend className="sr-only">Unidades</legend>
            {unidades.map((unidad) => (
              <CasillaUnidad key={unidad.id} unidad={unidad} marcada={asignadas.has(unidad.id)} />
            ))}
          </fieldset>
        )}

        {estado.error && (
          <p role="alert" className="text-[13px] font-semibold text-error">
            {estado.error}
          </p>
        )}

        <div className="flex gap-2">
          <button type="submit" disabled={enviando || unidades.length === 0} className={`${BOTON_PANEL_PRINCIPAL} flex-1`}>
            {enviando ? "Guardando…" : "Guardar unidades"}
          </button>
          <button type="button" onClick={onCancelar} disabled={enviando} className={BOTON_PANEL_SECUNDARIO}>
            Cancelar
          </button>
        </div>
      </form>
    </section>
  );
}

/** El color de la ruta va con su ícono y su nombre: nunca solo. */
function CasillaUnidad({ unidad, marcada }: { unidad: OpcionDeUnidad; marcada: boolean }) {
  return (
    <label className="flex min-h-10 cursor-pointer items-center gap-3 rounded-[10px] px-2 py-1.5 hover:bg-fondo focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-marca-profundo">
      <input
        type="checkbox"
        name="unidadId"
        value={unidad.id}
        defaultChecked={marcada}
        className="size-[18px] shrink-0 accent-marca-profundo focus-visible:outline-none"
      />
      <span
        aria-hidden="true"
        className="grid size-7 shrink-0 place-items-center rounded-full"
        style={{ backgroundColor: colorDeRuta(unidad.rutaColor), color: tintaSobreColorDeRuta(unidad.rutaColor) }}
      >
        <IconoRuta icono={unidad.rutaIcono} tamano={14} />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-bold">
          {unidad.nombre}
          {!unidad.activa && <span className="font-normal text-tinta-media"> · inactiva</span>}
        </span>
        <span className="truncate text-[12.5px] text-tinta-media">{unidad.rutaNombre ?? "Sin ruta asignada"}</span>
      </span>
    </label>
  );
}
