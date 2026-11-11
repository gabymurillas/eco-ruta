"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { BOTON_PANEL_PELIGRO, BOTON_PANEL_SECUNDARIO } from "@/components/ui/estilos-panel";
import { quitarAcceso } from "../acciones";
import type { FichaMiembro } from "./FilaMiembro";

type Props = {
  miembro: FichaMiembro;
  onCancelar: () => void;
  onQuitado: () => void;
};

/** Pide confirmación con las consecuencias a la vista: la cuenta se borra. */
export function ConfirmarQuitarAcceso({ miembro, onCancelar, onQuitado }: Props) {
  const [error, setError] = useState<string>();
  const [quitando, iniciar] = useTransition();
  const titulo = useRef<HTMLHeadingElement>(null);

  // El panel aparece en la otra punta de la pantalla: sin mover el foco, quien
  // navega con teclado o lector de pantalla no se entera de que se abrió.
  useEffect(() => {
    titulo.current?.focus();
  }, []);

  function confirmar() {
    iniciar(async () => {
      const resultado = await quitarAcceso(miembro.id);

      if (resultado.error) {
        setError(resultado.error);
        return;
      }

      onQuitado();
    });
  }

  return (
    <section aria-labelledby="titulo-quitar-acceso" className="flex flex-col gap-3">
      <h2
        ref={titulo}
        id="titulo-quitar-acceso"
        tabIndex={-1}
        className="text-[19px] leading-tight font-extrabold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error"
      >
        {miembro.invitacionPendiente ? "¿Cancelar la invitación?" : "¿Quitar el acceso?"}
      </h2>
      <p className="text-[13px] leading-relaxed break-all text-tinta-media">{miembro.correo}</p>

      <ul className="flex list-disc flex-col gap-1.5 pl-4 text-[13px] leading-relaxed text-tinta-media">
        {miembro.invitacionPendiente ? (
          <li>El enlace que recibió deja de servir.</li>
        ) : (
          <>
            <li>Su cuenta se borra y ya no puede entrar al panel.</li>
            <li>Una sesión que tenga abierta se cierra sola en menos de una hora.</li>
          </>
        )}
        <li>Si vuelve al equipo, se le invita de nuevo.</li>
      </ul>

      {error && (
        <p role="alert" className="text-[13px] font-semibold text-error">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button type="button" onClick={confirmar} disabled={quitando} className={`${BOTON_PANEL_PELIGRO} flex-1`}>
          {quitando ? "Quitando…" : error ? "Reintentar" : miembro.invitacionPendiente ? "Sí, cancelarla" : "Sí, quitar acceso"}
        </button>
        <button type="button" onClick={onCancelar} disabled={quitando} className={BOTON_PANEL_SECUNDARIO}>
          Volver
        </button>
      </div>
    </section>
  );
}
