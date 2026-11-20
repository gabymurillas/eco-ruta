"use client";

import { useState, useTransition } from "react";
import { BOTON_PANEL_PRINCIPAL } from "@/components/ui/estilos-panel";
import type { Letrero } from "@/services/letreros.service";
import { cambiarActivo } from "../acciones";
import { ConfirmarEliminarLetrero } from "./ConfirmarEliminarLetrero";
import { FormularioLetrero } from "./FormularioLetrero";
import { LetrerosVacio } from "./LetrerosVacio";
import { idBotonDeFila, TablaLetreros, type AccionDeFila } from "./TablaLetreros";
import { UnidadesDelLetrero, type OpcionDeUnidad } from "./UnidadesDelLetrero";

type Props = {
  letreros: readonly Letrero[];
  unidades: readonly OpcionDeUnidad[];
  /** Falso para el operador: ve el catálogo, sin acciones. */
  puedeEditar: boolean;
};

type Panel = { modo: "ninguno" } | { modo: "nuevo" } | { modo: AccionDeFila; letreroId: string };

const NINGUNO: Panel = { modo: "ninguno" };

export function SeccionLetreros({ letreros, unidades, puedeEditar }: Props) {
  const [panel, setPanel] = useState<Panel>(NINGUNO);
  const [errorDeFila, setErrorDeFila] = useState<string>();
  const [cambiandoId, setCambiandoId] = useState<string | null>(null);
  const [, iniciar] = useTransition();
  const activos = letreros.filter((letrero) => letrero.activo).length;
  const elegidoId = "letreroId" in panel ? panel.letreroId : null;

  /** Al cerrar el panel, el foco vuelve al botón que lo abrió. */
  function cerrar() {
    if ("letreroId" in panel) {
      document.getElementById(idBotonDeFila(panel.letreroId, panel.modo))?.focus();
    }
    setPanel(NINGUNO);
  }

  function alternarActivo(letrero: Letrero) {
    setCambiandoId(letrero.id);
    iniciar(async () => {
      const resultado = await cambiarActivo(letrero.id, !letrero.activo);
      setErrorDeFila(resultado.error);
      setCambiandoId(null);
    });
  }

  return (
    <div className="flex h-dvh min-h-0 flex-col gap-4 p-6">
      <header className="flex flex-wrap items-center gap-x-3.5 gap-y-3">
        <h1 className="text-[26px] font-extrabold tracking-tight">Letreros</h1>
        <p className="text-sm text-tinta-media">
          {letreros.length === 1 ? "1 letrero" : `${letreros.length} letreros`} · {activos}{" "}
          {activos === 1 ? "activo" : "activos"}
        </p>
        {puedeEditar && (
          <button type="button" onClick={() => setPanel({ modo: "nuevo" })} className={`${BOTON_PANEL_PRINCIPAL} ml-auto`}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nuevo letrero
          </button>
        )}
      </header>

      <p className="-mt-2 text-[13px] text-tinta-media">
        El conductor elige entre estas opciones desde la app; la web lo muestra junto al nombre
        de la ruta.
      </p>

      {errorDeFila && (
        <p role="alert" className="text-[13px] font-semibold text-error">
          {errorDeFila}
        </p>
      )}

      <div className="flex min-h-0 flex-1 gap-4">
        <section
          aria-label="Catálogo de letreros"
          className="min-w-0 flex-1 overflow-y-auto rounded-2xl border border-borde bg-superficie"
        >
          {letreros.length === 0 ? (
            <LetrerosVacio puedeEditar={puedeEditar} />
          ) : (
            <TablaLetreros
              letreros={letreros}
              elegidoId={elegidoId}
              cambiandoId={cambiandoId}
              onAccion={puedeEditar ? (letreroId, modo) => setPanel({ modo, letreroId }) : null}
              onAlternarActivo={alternarActivo}
            />
          )}
        </section>

        {/* El panel lateral es solo de escritura: sin permiso, la tabla usa todo el ancho. */}
        {puedeEditar && (
          <aside className="w-[330px] shrink-0 overflow-y-auto rounded-2xl border border-borde bg-superficie p-5">
            <ContenidoPanel
              panel={panel}
              letreros={letreros}
              unidades={unidades}
              onCerrar={cerrar}
              onTerminado={() => setPanel(NINGUNO)}
            />
          </aside>
        )}
      </div>
    </div>
  );
}

function ContenidoPanel({
  panel,
  letreros,
  unidades,
  onCerrar,
  onTerminado,
}: {
  panel: Panel;
  letreros: readonly Letrero[];
  unidades: readonly OpcionDeUnidad[];
  onCerrar: () => void;
  onTerminado: () => void;
}) {
  if (panel.modo === "nuevo") {
    return <FormularioLetrero onCancelar={onCerrar} onGuardado={onTerminado} />;
  }

  const letrero = panel.modo === "ninguno" ? undefined : letreros.find((l) => l.id === panel.letreroId);

  if (!letrero) {
    return (
      <p className="text-[13px] leading-relaxed text-tinta-media">
        Elige «Unidades» en un letrero para decidir qué unidades pueden usarlo. Un letrero
        sin unidades no aparece en ninguna app.
      </p>
    );
  }

  if (panel.modo === "editar") {
    return <FormularioLetrero key={letrero.id} letrero={letrero} onCancelar={onCerrar} onGuardado={onTerminado} />;
  }

  if (panel.modo === "eliminar") {
    return <ConfirmarEliminarLetrero key={letrero.id} letrero={letrero} onCancelar={onCerrar} onEliminado={onTerminado} />;
  }

  return (
    <UnidadesDelLetrero key={letrero.id} letrero={letrero} unidades={unidades} onCancelar={onCerrar} onGuardado={onTerminado} />
  );
}
