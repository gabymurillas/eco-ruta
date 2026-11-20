"use client";

import { useActionState, useEffect, useRef } from "react";
import { Campo } from "@/components/ui/Campo";
import { BOTON_PANEL_PRINCIPAL, BOTON_PANEL_SECUNDARIO } from "@/components/ui/estilos-panel";
import { LARGO_MAXIMO_NOMBRE_LETRERO } from "@/domain/catalogo-letreros";
import type { Letrero } from "@/services/letreros.service";
import { guardarLetrero, type EstadoLetreros } from "../acciones";

type Props = {
  /** Presente al editar. Ausente al crear. */
  letrero?: Letrero;
  onCancelar: () => void;
  onGuardado: () => void;
};

const ESTADO_INICIAL: EstadoLetreros = {};

export function FormularioLetrero({ letrero, onCancelar, onGuardado }: Props) {
  const [estado, enviar, enviando] = useActionState(
    async (previo: EstadoLetreros, datos: FormData) => {
      const resultado = await guardarLetrero(previo, datos);
      if (resultado.guardado) {
        onGuardado();
      }
      return resultado;
    },
    ESTADO_INICIAL,
  );
  const titulo = useRef<HTMLHeadingElement>(null);

  // El panel se abre lejos del botón que lo pidió: el foco tiene que ir con él.
  useEffect(() => {
    titulo.current?.focus();
  }, []);

  return (
    <section aria-labelledby="titulo-formulario-letrero" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2
          ref={titulo}
          id="titulo-formulario-letrero"
          tabIndex={-1}
          className="text-[19px] leading-tight font-extrabold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo"
        >
          {letrero ? `Editar «${letrero.nombre}»` : "Nuevo letrero"}
        </h2>
        <p className="text-[13px] leading-relaxed text-tinta-media">
          Escríbelo como va en el cartel de la unidad. Solo cambia el nombre que se ve: la
          ruta, sus paradas y el tiempo estimado siguen igual.
        </p>
      </div>

      <form action={enviar} className="flex flex-col gap-4">
        {letrero && <input type="hidden" name="letreroId" value={letrero.id} />}

        <Campo
          etiqueta="Nombre"
          name="nombre"
          id="nombre-letrero"
          required
          maxLength={LARGO_MAXIMO_NOMBRE_LETRERO}
          placeholder="Terminal – Villa Olímpica"
          defaultValue={letrero?.nombre ?? ""}
        />

        <Campo
          etiqueta="Orden"
          name="orden"
          id="orden-letrero"
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          defaultValue={letrero?.orden ?? 0}
          ayuda="En la app, los números menores salen primero. Pon arriba las más usadas."
        />

        <label className="flex items-start gap-2.5 text-[13.5px] leading-snug font-semibold">
          <input
            type="checkbox"
            name="activo"
            defaultChecked={letrero?.activo ?? true}
            className="mt-0.5 size-[18px] shrink-0 accent-marca-profundo"
          />
          <span>
            Activo
            <span className="block text-xs font-normal text-tinta-media">
              Si lo desactivas, deja de aparecer en la app y las unidades que lo tengan
              elegido vuelven al nombre normal.
            </span>
          </span>
        </label>

        {estado.error && (
          <p role="alert" className="text-[13px] font-semibold text-error">
            {estado.error}
          </p>
        )}

        <div className="flex gap-2">
          <button type="submit" disabled={enviando} className={`${BOTON_PANEL_PRINCIPAL} flex-1`}>
            {enviando ? "Guardando…" : letrero ? "Guardar cambios" : "Crear letrero"}
          </button>
          <button type="button" onClick={onCancelar} disabled={enviando} className={BOTON_PANEL_SECUNDARIO}>
            Cancelar
          </button>
        </div>
      </form>
    </section>
  );
}
