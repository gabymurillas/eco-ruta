"use client";

import { useActionState, useState } from "react";
import { BOTON_PANEL_PRINCIPAL } from "@/components/ui/estilos-panel";
import { vincular, type EstadoUnidades } from "../acciones";
import { ConfirmarEliminarUnidad } from "./ConfirmarEliminarUnidad";
import { FilaUnidad, idBotonDeFila, type AccionDeFila, type FichaUnidad } from "./FilaUnidad";
import { FormularioUnidad, type OpcionDeRuta } from "./FormularioUnidad";
import { PanelVinculacion } from "./PanelVinculacion";

type Props = {
  unidades: readonly FichaUnidad[];
  rutas: readonly OpcionDeRuta[];
  umbralBateriaPct: number;
};

type Panel = { modo: "ninguno" } | { modo: "nueva" } | { modo: AccionDeFila; unidadId: string };

const NINGUNO: Panel = { modo: "ninguno" };
const ESTADO_INICIAL: EstadoUnidades = {};

export function SeccionUnidades({ unidades, rutas, umbralBateriaPct }: Props) {
  const [panel, setPanel] = useState<Panel>(NINGUNO);
  const [busqueda, setBusqueda] = useState("");
  const vinculadas = unidades.filter((unidad) => unidad.vinculado).length;
  const visibles = unidades.filter((unidad) => coincide(unidad, busqueda));
  const elegidaId = "unidadId" in panel ? panel.unidadId : null;

  /** Al cerrar el panel, el foco vuelve al botón que lo abrió. */
  function cerrar() {
    if ("unidadId" in panel) {
      document.getElementById(idBotonDeFila(panel.unidadId, panel.modo))?.focus();
    }
    setPanel(NINGUNO);
  }

  return (
    <div className="flex h-dvh min-h-0 flex-col gap-4 p-6">
      <header className="flex flex-wrap items-center gap-x-3.5 gap-y-3">
        <h1 className="text-[26px] font-extrabold tracking-tight">Unidades</h1>
        <p className="text-sm text-tinta-media">
          {unidades.length === 1 ? "1 unidad" : `${unidades.length} unidades`} · {vinculadas} con
          teléfono vinculado
        </p>
        <div className="ml-auto flex items-center gap-2">
          {unidades.length > 0 && <Buscador valor={busqueda} onCambio={setBusqueda} />}
          <button type="button" onClick={() => setPanel({ modo: "nueva" })} className={BOTON_PANEL_PRINCIPAL}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nueva unidad
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 gap-4">
        <section
          aria-label="Lista de unidades"
          className="min-w-0 flex-1 overflow-y-auto rounded-2xl border border-borde bg-superficie"
        >
          <TablaUnidades
            unidades={visibles}
            hayUnidades={unidades.length > 0}
            elegidaId={elegidaId}
            umbralBateriaPct={umbralBateriaPct}
            onAccion={(unidadId, modo) => setPanel({ modo, unidadId })}
          />
        </section>

        <aside className="w-[330px] shrink-0 overflow-y-auto rounded-2xl border border-borde bg-superficie p-5">
          <ContenidoPanel
            panel={panel}
            unidades={unidades}
            rutas={rutas}
            onCerrar={cerrar}
            onGuardada={(unidadId, creada) =>
              // Lo que sigue a crear una unidad es vincular su teléfono.
              setPanel(creada ? { modo: "vincular", unidadId } : NINGUNO)
            }
          />
        </aside>
      </div>
    </div>
  );
}

function TablaUnidades({
  unidades,
  hayUnidades,
  elegidaId,
  umbralBateriaPct,
  onAccion,
}: {
  unidades: readonly FichaUnidad[];
  hayUnidades: boolean;
  elegidaId: string | null;
  umbralBateriaPct: number;
  onAccion: (unidadId: string, accion: AccionDeFila) => void;
}) {
  if (unidades.length === 0) {
    return (
      <p className="p-6 text-sm text-tinta-media">
        {hayUnidades
          ? "Ninguna unidad coincide con la búsqueda."
          : "Todavía no hay unidades. Crea la primera con «Nueva unidad» y vincula el teléfono que va en ella."}
      </p>
    );
  }

  return (
    <table className="w-full border-collapse text-sm">
      <caption className="sr-only">Unidades registradas y estado de su teléfono</caption>
      <thead className="sticky top-0 z-10 bg-fondo">
        <tr className="text-left text-[12.5px] font-bold text-tinta-media">
          <th scope="col" className="border-b border-borde px-4 py-2.5">Unidad y ruta</th>
          <th scope="col" className="border-b border-borde px-4 py-2.5">Teléfono</th>
          <th scope="col" className="border-b border-borde px-4 py-2.5">Batería</th>
          <th scope="col" className="border-b border-borde px-4 py-2.5 text-right">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {unidades.map((unidad) => (
          <FilaUnidad
            key={unidad.id}
            unidad={unidad}
            elegida={unidad.id === elegidaId}
            umbralBateriaPct={umbralBateriaPct}
            onAccion={(accion) => onAccion(unidad.id, accion)}
          />
        ))}
      </tbody>
    </table>
  );
}

function ContenidoPanel({
  panel,
  unidades,
  rutas,
  onCerrar,
  onGuardada,
}: {
  panel: Panel;
  unidades: readonly FichaUnidad[];
  rutas: readonly OpcionDeRuta[];
  onCerrar: () => void;
  onGuardada: (unidadId: string, creada: boolean) => void;
}) {
  if (panel.modo === "nueva") {
    return <FormularioUnidad rutas={rutas} onCancelar={onCerrar} onGuardada={(id) => onGuardada(id, true)} />;
  }

  const unidad = panel.modo === "ninguno" ? undefined : unidades.find((u) => u.id === panel.unidadId);

  if (!unidad) {
    return (
      <p className="text-[13px] leading-relaxed text-tinta-media">
        Elige «Vincular» en una unidad para generar su código. El teléfono queda atado a esa
        unidad; el chofer no necesita cuenta.
      </p>
    );
  }

  if (panel.modo === "editar") {
    return (
      <FormularioUnidad key={unidad.id} unidad={unidad} rutas={rutas} onCancelar={onCerrar} onGuardada={(id) => onGuardada(id, false)} />
    );
  }

  if (panel.modo === "eliminar") {
    return (
      <ConfirmarEliminarUnidad key={unidad.id} unidad={unidad} onCancelar={onCerrar} onEliminada={() => onGuardada(unidad.id, false)} />
    );
  }

  return <FormularioVinculacion key={unidad.id} unidad={unidad} />;
}

function FormularioVinculacion({ unidad }: { unidad: FichaUnidad }) {
  const [estado, enviar, generando] = useActionState(vincular, ESTADO_INICIAL);

  // Con el teléfono ya vinculado no hay código que mostrar: el último se canjeó.
  // Si no, manda el recién generado y, en su defecto, el pendiente guardado.
  const guardado =
    unidad.telefono === "codigo_pendiente" && unidad.codigoVinculacion && unidad.codigoExpiraAt
      ? { codigo: unidad.codigoVinculacion, expiraEn: unidad.codigoExpiraAt }
      : null;
  const codigo = unidad.vinculado ? null : (estado.codigo ?? guardado);

  return (
    <form action={enviar} className="flex flex-col gap-3">
      <input type="hidden" name="unidadId" value={unidad.id} />
      <PanelVinculacion
        unidadNombre={unidad.nombre}
        vinculado={unidad.vinculado}
        codigo={codigo}
        generando={generando}
      />
      {estado.error && (
        <p role="alert" className="text-[13px] font-semibold text-error">
          {estado.error}
        </p>
      )}
    </form>
  );
}

function Buscador({ valor, onCambio }: { valor: string; onCambio: (valor: string) => void }) {
  return (
    <label className="flex h-10 w-56 items-center gap-2 rounded-[10px] border-[1.5px] border-borde-campo bg-superficie px-3 text-tinta-media focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-marca-profundo">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="6.5" />
        <path d="M16 16l4.5 4.5" />
      </svg>
      <span className="sr-only">Buscar unidad</span>
      <input
        type="search"
        value={valor}
        onChange={(evento) => onCambio(evento.target.value)}
        placeholder="Buscar unidad o ruta"
        className="min-w-0 flex-1 bg-transparent text-sm text-tinta outline-none placeholder:text-tinta-suave"
      />
    </label>
  );
}

/** Sin distinguir mayúsculas ni tildes: «camion» encuentra «Camión 2». */
function coincide(unidad: FichaUnidad, busqueda: string): boolean {
  const termino = normalizar(busqueda.trim());
  return !termino || normalizar(`${unidad.nombre} ${unidad.rutaNombre ?? ""}`).includes(termino);
}

function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}
