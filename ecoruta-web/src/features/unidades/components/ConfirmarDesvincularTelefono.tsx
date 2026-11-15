"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { BOTON_PANEL_PELIGRO, BOTON_PANEL_SECUNDARIO } from "@/components/ui/estilos-panel";
import type { UnidadConRuta } from "@/services/unidades.service";
import { desvincular } from "../acciones";

type Props = {
  unidad: UnidadConRuta;
  onCancelar: () => void;
};

/**
 * Antes de vincular otro teléfono hay que cortar el actual: un código nuevo no le quita
 * la sesión (brecha TS-04). A diferencia de eliminar, la unidad y su historial se quedan.
 *
 * Al terminar no avisa a nadie: la acción revalida la página, la unidad llega sin
 * teléfono y el panel pasa solo a generar el código.
 */
export function ConfirmarDesvincularTelefono({ unidad, onCancelar }: Props) {
  const [error, setError] = useState<string>();
  const [desvinculando, iniciar] = useTransition();
  const titulo = useRef<HTMLHeadingElement>(null);

  // El panel aparece en la otra punta de la pantalla: sin mover el foco, quien
  // navega con teclado o lector de pantalla no se entera de que se abrió.
  useEffect(() => {
    titulo.current?.focus();
  }, []);

  function confirmar() {
    iniciar(async () => {
      const resultado = await desvincular(unidad.id);
      setError(resultado.error);
    });
  }

  return (
    <section aria-labelledby="titulo-desvincular" className="flex flex-col gap-3">
      <h2
        ref={titulo}
        id="titulo-desvincular"
        tabIndex={-1}
        className="text-[19px] leading-tight font-extrabold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error"
      >
        ¿Desvincular el teléfono de «{unidad.nombre}»?
      </h2>

      <ul className="flex list-disc flex-col gap-1.5 pl-4 text-[13px] leading-relaxed text-tinta-media">
        <li>
          El teléfono pierde el acceso: en menos de un minuto vuelve a la pantalla de
          vinculación y deja de transmitir.
        </li>
        <li>Si la unidad está en recorrido, el viaje se da por terminado.</li>
        <li>La unidad, sus viajes y el recorrido registrado se conservan.</li>
        <li>Después podrás generar un código para vincular otro teléfono, o el mismo.</li>
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
          disabled={desvinculando}
          className={`${BOTON_PANEL_PELIGRO} flex-1`}
        >
          {desvinculando ? "Desvinculando…" : error ? "Reintentar" : "Sí, desvincular"}
        </button>
        <button type="button" onClick={onCancelar} disabled={desvinculando} className={BOTON_PANEL_SECUNDARIO}>
          Cancelar
        </button>
      </div>
    </section>
  );
}
