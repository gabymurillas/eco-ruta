"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { BOTON_PANEL_PELIGRO, BOTON_PANEL_SECUNDARIO } from "@/components/ui/estilos-panel";
import type { UnidadConRuta } from "@/services/unidades.service";
import { eliminar } from "../acciones";

type Props = {
  unidad: UnidadConRuta;
  onCancelar: () => void;
  onEliminada: () => void;
};

/**
 * Pide confirmación con las consecuencias a la vista: borrar una unidad se lleva
 * su historial, y no se puede deshacer.
 */
export function ConfirmarEliminarUnidad({ unidad, onCancelar, onEliminada }: Props) {
  const [error, setError] = useState<string>();
  const [eliminando, iniciar] = useTransition();
  const titulo = useRef<HTMLHeadingElement>(null);

  // El panel aparece en la otra punta de la pantalla: sin mover el foco, quien
  // navega con teclado o lector de pantalla no se entera de que se abrió.
  useEffect(() => {
    titulo.current?.focus();
  }, []);

  function confirmar() {
    iniciar(async () => {
      const resultado = await eliminar(unidad.id);

      if (resultado.error) {
        setError(resultado.error);
        return;
      }

      onEliminada();
    });
  }

  return (
    <section
      aria-labelledby="titulo-eliminar-unidad"
      className="flex flex-col gap-3"
    >
      <h2
        ref={titulo}
        id="titulo-eliminar-unidad"
        tabIndex={-1}
        className="text-[19px] leading-tight font-extrabold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error"
      >
        ¿Eliminar «{unidad.nombre}»?
      </h2>

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
          className={`${BOTON_PANEL_PELIGRO} flex-1`}
        >
          {eliminando ? "Eliminando…" : error ? "Reintentar" : "Sí, eliminar"}
        </button>
        <button type="button" onClick={onCancelar} disabled={eliminando} className={BOTON_PANEL_SECUNDARIO}>
          Cancelar
        </button>
      </div>
    </section>
  );
}
