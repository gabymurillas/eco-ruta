"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { BOTON_PANEL_PELIGRO, BOTON_PANEL_SECUNDARIO } from "@/components/ui/estilos-panel";
import type { Letrero } from "@/services/letreros.service";
import { eliminar } from "../acciones";

type Props = {
  letrero: Letrero;
  onCancelar: () => void;
  onEliminado: () => void;
};

/** Pide confirmación con las consecuencias a la vista: no se puede deshacer. */
export function ConfirmarEliminarLetrero({ letrero, onCancelar, onEliminado }: Props) {
  const [error, setError] = useState<string>();
  const [eliminando, iniciar] = useTransition();
  const titulo = useRef<HTMLHeadingElement>(null);
  const cantidad = letrero.unidadIds.length;

  // El panel aparece en la otra punta de la pantalla: sin mover el foco, quien
  // navega con teclado o lector de pantalla no se entera de que se abrió.
  useEffect(() => {
    titulo.current?.focus();
  }, []);

  function confirmar() {
    iniciar(async () => {
      const resultado = await eliminar(letrero.id);

      if (resultado.error) {
        setError(resultado.error);
        return;
      }

      onEliminado();
    });
  }

  return (
    <section aria-labelledby="titulo-eliminar-letrero" className="flex flex-col gap-3">
      <h2
        ref={titulo}
        id="titulo-eliminar-letrero"
        tabIndex={-1}
        className="text-[19px] leading-tight font-extrabold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error"
      >
        ¿Eliminar «{letrero.nombre}»?
      </h2>

      <ul className="flex list-disc flex-col gap-1.5 pl-4 text-[13px] leading-relaxed text-tinta-media">
        <li>
          {cantidad === 0
            ? "Ninguna unidad lo tiene entre sus opciones."
            : `Desaparece de las opciones de ${cantidad === 1 ? "1 unidad" : `${cantidad} unidades`}.`}
        </li>
        <li>
          Las unidades que lo tengan elegido vuelven al nombre normal de su ruta, en la app
          y en la web.
        </li>
        <li>No se puede deshacer. Si solo quieres ocultarlo un tiempo, desactívalo.</li>
      </ul>

      {error && (
        <p role="alert" className="text-[13px] font-semibold text-error">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button type="button" onClick={confirmar} disabled={eliminando} className={`${BOTON_PANEL_PELIGRO} flex-1`}>
          {eliminando ? "Eliminando…" : error ? "Reintentar" : "Sí, eliminar"}
        </button>
        <button type="button" onClick={onCancelar} disabled={eliminando} className={BOTON_PANEL_SECUNDARIO}>
          Cancelar
        </button>
      </div>
    </section>
  );
}
