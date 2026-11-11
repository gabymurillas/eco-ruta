"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { BOTON_PANEL_PRINCIPAL, BOTON_PANEL_SECUNDARIO } from "@/components/ui/estilos-panel";
import type { RolDelPanel } from "@/domain/roles";
import { cambiarRol } from "../acciones";
import type { FichaMiembro } from "./FilaMiembro";
import { SelectorDeRol } from "./SelectorDeRol";

type Props = {
  miembro: FichaMiembro;
  onCerrar: () => void;
};

export function FormularioRol({ miembro, onCerrar }: Props) {
  const [rol, setRol] = useState<RolDelPanel>(miembro.rol);
  const [error, setError] = useState<string>();
  const [guardando, iniciar] = useTransition();
  const titulo = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titulo.current?.focus();
  }, []);

  function guardar() {
    iniciar(async () => {
      const resultado = await cambiarRol(miembro.id, rol);

      if (resultado.error) {
        setError(resultado.error);
        return;
      }

      onCerrar();
    });
  }

  return (
    <section aria-labelledby="titulo-rol" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2
          ref={titulo}
          id="titulo-rol"
          tabIndex={-1}
          className="text-[19px] leading-tight font-extrabold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo"
        >
          Cambiar rol
        </h2>
        <p className="text-[13px] leading-relaxed break-all text-tinta-media">{miembro.correo}</p>
      </div>

      <SelectorDeRol name="rol-miembro" elegido={rol} onCambio={setRol} />

      <p className="text-[12.5px] leading-relaxed text-tinta-media">
        El cambio se aplica en el panel de inmediato. Si la persona tiene una sesión abierta,
        puede tardar hasta una hora en reflejarse por completo.
      </p>

      {error && (
        <p role="alert" className="text-[13px] font-semibold text-error">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={guardar}
          disabled={guardando || rol === miembro.rol}
          className={`${BOTON_PANEL_PRINCIPAL} flex-1`}
        >
          {guardando ? "Guardando…" : "Guardar rol"}
        </button>
        <button type="button" onClick={onCerrar} disabled={guardando} className={BOTON_PANEL_SECUNDARIO}>
          Cancelar
        </button>
      </div>
    </section>
  );
}
