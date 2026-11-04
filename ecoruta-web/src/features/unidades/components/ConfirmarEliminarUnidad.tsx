"use client";

import { useState, useTransition } from "react";
import { Boton } from "@/components/ui/Boton";
import type { UnidadConRuta } from "@/services/unidades.service";
import { eliminar } from "../acciones";

type Props = {
  unidad: UnidadConRuta;
  onTerminar: () => void;
};

/**
 * Pide confirmación con las consecuencias a la vista: borrar una unidad se lleva
 * su historial, y no se puede deshacer.
 */
export function ConfirmarEliminarUnidad({ unidad, onTerminar }: Props) {
  const [error, setError] = useState<string>();
  const [eliminando, iniciar] = useTransition();

  function confirmar() {
    iniciar(async () => {
      const resultado = await eliminar(unidad.id);

      if (resultado.error) {
        setError(resultado.error);
        return;
      }

      onTerminar();
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border-[0.5px] border-error bg-superficie p-5">
      <h2 className="font-serif text-[15px] font-bold">¿Eliminar «{unidad.nombre}»?</h2>

      <ul className="flex list-disc flex-col gap-1.5 pl-4 text-[13px] leading-relaxed text-tinta-media">
        <li>
          Se borran también sus viajes y el recorrido registrado: dejan de contar en los
          históricos. Las incidencias que reportó se conservan.
        </li>
        {unidad.vinculado && (
          <li>
            Su teléfono pierde el acceso: en menos de un minuto vuelve a la pantalla de
            vinculación y deja de transmitir.
          </li>
        )}
        <li>No se puede deshacer.</li>
      </ul>

      {error && (
        <p role="alert" className="text-[13px] font-semibold text-error">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={confirmar}
          disabled={eliminando}
          className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-error px-5 text-[15px] font-bold text-superficie transition-[filter] duration-300 ease-out hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error disabled:opacity-50"
        >
          {eliminando ? "Eliminando…" : error ? "Reintentar" : "Sí, eliminar"}
        </button>
        <Boton variante="secundario" onClick={onTerminar} disabled={eliminando}>
          No
        </Boton>
      </div>
    </div>
  );
}
