"use client";

import { useActionState, useEffect, useRef } from "react";
import { Campo } from "@/components/ui/Campo";
import { BOTON_PANEL_PRINCIPAL, BOTON_PANEL_SECUNDARIO } from "@/components/ui/estilos-panel";
import { invitar, type EstadoInvitacion } from "../acciones";
import { SelectorDeRol } from "./SelectorDeRol";

type Props = {
  onCerrar: () => void;
};

const ESTADO_INICIAL: EstadoInvitacion = {};

/**
 * Invitar es mandar un correo con un enlace para que la persona elija su
 * contraseña. Nadie en el equipo conoce la contraseña de otro.
 */
export function FormularioInvitar({ onCerrar }: Props) {
  const [estado, enviar, enviando] = useActionState(invitar, ESTADO_INICIAL);
  const titulo = useRef<HTMLHeadingElement>(null);

  // El panel se abre lejos del botón que lo pidió: el foco tiene que ir con él.
  useEffect(() => {
    titulo.current?.focus();
  }, []);

  if (estado.enviadaA) {
    return (
      <section aria-labelledby="titulo-invitar" className="flex flex-col gap-3">
        <h2 id="titulo-invitar" role="status" className="text-[19px] leading-tight font-extrabold">
          Invitación enviada
        </h2>
        <p className="text-[13px] leading-relaxed text-tinta-media">
          Le escribimos a <b className="break-all text-tinta">{estado.enviadaA}</b> con un enlace para
          crear su contraseña. El enlace vence pronto: si no llega o no lo abre a tiempo, reenvíala
          desde la lista.
        </p>
        <button type="button" onClick={onCerrar} className={BOTON_PANEL_SECUNDARIO}>
          Listo
        </button>
      </section>
    );
  }

  return (
    <section aria-labelledby="titulo-invitar" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2
          ref={titulo}
          id="titulo-invitar"
          tabIndex={-1}
          className="text-[19px] leading-tight font-extrabold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo"
        >
          Invitar a una persona
        </h2>
        <p className="text-[13px] leading-relaxed text-tinta-media">
          Le llega un correo con un enlace para crear su contraseña.
        </p>
      </div>

      <form action={enviar} className="flex flex-col gap-4">
        <Campo
          etiqueta="Correo"
          name="correo"
          id="correo-invitacion"
          type="email"
          required
          autoComplete="off"
          placeholder="nombre@alcaldia.gob.ve"
          defaultValue={estado.correo ?? ""}
        />

        <SelectorDeRol name="rol" elegido="operador" />

        {estado.error && (
          <p role="alert" className="text-[13px] font-semibold text-error">
            {estado.error}
          </p>
        )}

        <div className="flex gap-2">
          <button type="submit" disabled={enviando} className={`${BOTON_PANEL_PRINCIPAL} flex-1`}>
            {enviando ? "Enviando…" : "Enviar invitación"}
          </button>
          <button type="button" onClick={onCerrar} disabled={enviando} className={BOTON_PANEL_SECUNDARIO}>
            Cancelar
          </button>
        </div>
      </form>
    </section>
  );
}
