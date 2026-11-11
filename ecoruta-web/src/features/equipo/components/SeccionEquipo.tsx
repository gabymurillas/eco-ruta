"use client";

import { useState, useTransition } from "react";
import { BOTON_PANEL_PRINCIPAL } from "@/components/ui/estilos-panel";
import { ALCANCE_DE_ROL, NOMBRE_DE_ROL, ROLES_DEL_PANEL } from "@/domain/roles";
import { reenviar } from "../acciones";
import { ConfirmarQuitarAcceso } from "./ConfirmarQuitarAcceso";
import { FilaMiembro, idBotonDeMiembro, type AccionDeMiembro, type FichaMiembro } from "./FilaMiembro";
import { FormularioInvitar } from "./FormularioInvitar";
import { FormularioRol } from "./FormularioRol";

type Props = {
  miembros: readonly FichaMiembro[];
  /** La cuenta de quien mira. */
  tuId: string;
};

type Panel = { modo: "ninguno" } | { modo: "invitar" } | { modo: AccionDeMiembro; miembroId: string };

type Aviso = { tono: "exito" | "error"; texto: string };

const NINGUNO: Panel = { modo: "ninguno" };

export function SeccionEquipo({ miembros, tuId }: Props) {
  const [panel, setPanel] = useState<Panel>(NINGUNO);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [reenviandoId, setReenviandoId] = useState<string | null>(null);
  const [, iniciar] = useTransition();
  const pendientes = miembros.filter((miembro) => miembro.invitacionPendiente).length;
  const elegidaId = "miembroId" in panel ? panel.miembroId : null;

  /** Al cerrar el panel, el foco vuelve al botón que lo abrió. */
  function cerrar() {
    if ("miembroId" in panel) {
      document.getElementById(idBotonDeMiembro(panel.miembroId, panel.modo))?.focus();
    }
    setPanel(NINGUNO);
  }

  function reenviarInvitacion(miembro: FichaMiembro) {
    setReenviandoId(miembro.id);
    setAviso(null);
    iniciar(async () => {
      const resultado = await reenviar(miembro.id);
      setReenviandoId(null);
      setAviso(
        resultado.error
          ? { tono: "error", texto: resultado.error }
          : { tono: "exito", texto: `Invitación reenviada a ${resultado.enviadaA || miembro.correo}.` },
      );
    });
  }

  return (
    <div className="flex min-h-dvh flex-col gap-4 p-4 sm:p-6 lg:h-dvh lg:min-h-0">
      <header className="flex flex-wrap items-center gap-x-3.5 gap-y-3">
        <h1 className="text-[26px] font-extrabold tracking-tight">Equipo</h1>
        <p className="text-sm text-tinta-media">
          {miembros.length === 1 ? "1 persona" : `${miembros.length} personas`} con acceso al panel
          {pendientes > 0 && ` · ${pendientes === 1 ? "1 invitación pendiente" : `${pendientes} invitaciones pendientes`}`}
        </p>
        <button
          type="button"
          onClick={() => setPanel({ modo: "invitar" })}
          className={`${BOTON_PANEL_PRINCIPAL} ml-auto`}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Invitar
        </button>
      </header>

      {aviso && (
        <p
          role={aviso.tono === "error" ? "alert" : "status"}
          className={`-mt-1 text-[13px] font-semibold ${aviso.tono === "error" ? "text-error" : "text-tinta-media"}`}
        >
          {aviso.texto}
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <section
          aria-label="Personas del equipo"
          className="min-w-0 flex-1 overflow-auto rounded-2xl border border-borde bg-superficie"
        >
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <caption className="sr-only">Cuentas con acceso al panel, su rol y su último ingreso</caption>
            <thead className="sticky top-0 z-10 bg-fondo">
              <tr className="text-left text-[12.5px] font-bold text-tinta-media">
                <th scope="col" className="border-b border-borde px-4 py-2.5">Persona</th>
                <th scope="col" className="border-b border-borde px-4 py-2.5">Rol</th>
                <th scope="col" className="border-b border-borde px-4 py-2.5">Último ingreso</th>
                <th scope="col" className="border-b border-borde px-4 py-2.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {miembros.map((miembro) => (
                <FilaMiembro
                  key={miembro.id}
                  miembro={miembro}
                  esTuCuenta={miembro.id === tuId}
                  elegida={miembro.id === elegidaId}
                  reenviando={miembro.id === reenviandoId}
                  onAccion={(modo) => setPanel({ modo, miembroId: miembro.id })}
                  onReenviar={() => reenviarInvitacion(miembro)}
                />
              ))}
            </tbody>
          </table>
        </section>

        <aside className="shrink-0 overflow-y-auto rounded-2xl border border-borde bg-superficie p-5 lg:w-[330px]">
          <ContenidoPanel panel={panel} miembros={miembros} onCerrar={cerrar} onQuitado={() => setPanel(NINGUNO)} />
        </aside>
      </div>
    </div>
  );
}

function ContenidoPanel({
  panel,
  miembros,
  onCerrar,
  onQuitado,
}: {
  panel: Panel;
  miembros: readonly FichaMiembro[];
  onCerrar: () => void;
  onQuitado: () => void;
}) {
  if (panel.modo === "invitar") {
    return <FormularioInvitar onCerrar={onCerrar} />;
  }

  const miembro = panel.modo === "ninguno" ? undefined : miembros.find((m) => m.id === panel.miembroId);

  if (!miembro) {
    return <QueHaceCadaRol />;
  }

  return panel.modo === "rol" ? (
    <FormularioRol key={miembro.id} miembro={miembro} onCerrar={onCerrar} />
  ) : (
    <ConfirmarQuitarAcceso key={miembro.id} miembro={miembro} onCancelar={onCerrar} onQuitado={onQuitado} />
  );
}

/** En reposo, el panel explica los roles: es lo que hay que saber antes de invitar. */
function QueHaceCadaRol() {
  return (
    <section aria-labelledby="titulo-roles" className="flex flex-col gap-3">
      <h2 id="titulo-roles" className="text-base font-bold">Qué puede hacer cada rol</h2>
      <dl className="flex flex-col gap-3">
        {ROLES_DEL_PANEL.map((rol) => (
          <div key={rol}>
            <dt className="text-sm font-bold">{NOMBRE_DE_ROL[rol]}</dt>
            <dd className="text-[13px] leading-relaxed text-tinta-media">{ALCANCE_DE_ROL[rol]}</dd>
          </div>
        ))}
      </dl>
      <p className="border-t border-borde-suave pt-3 text-[12.5px] leading-relaxed text-tinta-media">
        Nadie puede cambiar su propio rol ni quitarse el acceso, y siempre queda al menos un
        administrador.
      </p>
    </section>
  );
}
