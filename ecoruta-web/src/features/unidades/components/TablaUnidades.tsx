"use client";

import { useActionState, useState } from "react";
import { colorDeRuta, tintaSobreColorDeRuta } from "@/domain/colores";
import { estaVigente } from "@/domain/vinculacion";
import { IconoRuta } from "@/components/ui/IconoRuta";
import type { UnidadConRuta } from "@/services/unidades.service";
import { vincular, type EstadoUnidades } from "../acciones";
import { ConfirmarEliminarUnidad } from "./ConfirmarEliminarUnidad";
import { PanelVinculacion } from "./PanelVinculacion";

type Props = {
  unidades: readonly UnidadConRuta[];
};

const ESTADO_INICIAL: EstadoUnidades = {};

export function TablaUnidades({ unidades }: Props) {
  const [estado, enviar, enviando] = useActionState(vincular, ESTADO_INICIAL);
  const [unidadElegida, setUnidadElegida] = useState<string | null>(null);
  const [idAEliminar, setIdAEliminar] = useState<string | null>(null);

  const codigoActivo = estado.codigo;
  const unidadDelPanel = unidades.find(
    (unidad) => unidad.id === (codigoActivo?.unidadId ?? unidadElegida),
  );
  const unidadAEliminar = unidades.find((unidad) => unidad.id === idAEliminar);

  return (
    <div className="flex flex-1 gap-6 overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border-[0.5px] border-borde bg-superficie">
        <table className="w-full">
          <caption className="sr-only">
            Unidades registradas y estado de su dispositivo
          </caption>
          <thead>
            <tr className="border-b-[0.5px] border-borde bg-marca-tenue text-left">
              <Th className="w-56">Unidad</Th>
              <Th>Ruta asignada</Th>
              <Th className="w-44">Dispositivo</Th>
              <Th className="w-32">Batería</Th>
              <Th className="w-48 text-right">Acción</Th>
            </tr>
          </thead>

          <tbody>
            {unidades.map((unidad) => (
              <tr key={unidad.id} className="border-b-[0.5px] border-borde-suave">
                <Td>
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex size-8 shrink-0 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: colorDeRuta(unidad.rutaColor),
                        color: tintaSobreColorDeRuta(unidad.rutaColor),
                      }}
                    >
                      <IconoRuta icono={unidad.rutaIcono} tamano={17} />
                    </span>
                    <span className="font-serif text-[15px] font-bold">
                      {unidad.nombre}
                    </span>
                  </div>
                </Td>

                <Td>
                  <span className="text-sm font-semibold">
                    {unidad.rutaNombre ?? (
                      <span className="text-tinta-suave">Sin ruta asignada</span>
                    )}
                  </span>
                </Td>

                <Td>
                  <EstadoDispositivo unidad={unidad} />
                </Td>

                <Td>
                  <span className="text-sm font-semibold text-tinta-media">
                    {unidad.bateriaPct === null ? "—" : `${unidad.bateriaPct} %`}
                  </span>
                </Td>

                <Td className="whitespace-nowrap text-right">
                  <form
                    action={enviar}
                    onSubmit={() => {
                      setIdAEliminar(null);
                      setUnidadElegida(unidad.id);
                    }}
                    className="inline"
                  >
                    <input type="hidden" name="unidadId" value={unidad.id} />
                    <button
                      type="submit"
                      disabled={enviando}
                      className="rounded-full px-2 py-1 text-[13px] font-bold text-marca-profundo transition-colors duration-300 ease-out hover:bg-marca-tenue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo disabled:opacity-50"
                    >
                      {unidad.vinculado ? "Revincular" : "Vincular"}
                    </button>
                  </form>
                  <button
                    type="button"
                    onClick={() => setIdAEliminar(unidad.id)}
                    aria-label={`Eliminar ${unidad.nombre}`}
                    className="ml-1 rounded-full px-2 py-1 text-[13px] font-bold text-error transition-colors duration-300 ease-out hover:bg-error/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error"
                  >
                    Eliminar
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>

        {unidades.length === 0 && (
          <p className="p-6 text-sm text-tinta-media">
            Todavía no hay unidades registradas.
          </p>
        )}
      </div>

      <aside className="w-90 shrink-0 overflow-y-auto">
        {estado.error && (
          <p role="alert" className="text-[13px] font-semibold text-error">
            {estado.error}
          </p>
        )}

        {unidadAEliminar ? (
          <ConfirmarEliminarUnidad
            key={unidadAEliminar.id}
            unidad={unidadAEliminar}
            onTerminar={() => setIdAEliminar(null)}
          />
        ) : codigoActivo && unidadDelPanel ? (
          <form action={enviar}>
            <input type="hidden" name="unidadId" value={codigoActivo.unidadId} />
            <PanelVinculacion
              unidadNombre={unidadDelPanel.nombre}
              codigo={codigoActivo.codigo}
              expiraEn={codigoActivo.expiraEn}
              regenerando={enviando}
            />
          </form>
        ) : (
          <div className="rounded-2xl border-[0.5px] border-borde bg-superficie p-5">
            <p className="text-[13px] leading-relaxed text-tinta-media">
              Elige «Vincular» en una unidad para generar su código. El teléfono queda
              atado a esa unidad; el chofer no necesita cuenta.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

function EstadoDispositivo({ unidad }: { unidad: UnidadConRuta }) {
  const codigoVigente = estaVigente(unidad.codigoExpiraAt, new Date());

  if (unidad.vinculado) {
    return (
      <span className="flex items-center gap-2 text-[13px] font-bold">
        <span aria-hidden="true" className="size-[7px] rounded-full bg-exito" />
        Vinculado
      </span>
    );
  }

  if (codigoVigente) {
    return (
      <span className="flex items-center gap-2 text-[13px] font-bold text-advertencia-tinta">
        <span aria-hidden="true" className="size-[7px] rounded-full bg-advertencia" />
        Código pendiente
      </span>
    );
  }

  return (
    <span className="flex items-center gap-2 text-[13px] font-bold text-tinta-suave">
      <span aria-hidden="true" className="size-[7px] rounded-full bg-tinta-suave" />
      Sin vincular
    </span>
  );
}

function Th({ children, className = "" }: { children: string; className?: string }) {
  return (
    <th
      scope="col"
      className={`px-5 py-3 text-xs font-bold tracking-wide text-tinta-suave ${className}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-5 py-4 ${className}`}>{children}</td>;
}
