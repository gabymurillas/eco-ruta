"use client";

import { formatearDistancia } from "@/domain/formato";
import type { useEditorDeRuta, ViajeGrabado } from "../hooks/useEditorDeRuta";

type Props = {
  viajes: readonly ViajeGrabado[];
  editor: ReturnType<typeof useEditorDeRuta>;
  /** Al cargar un viaje el panel vuelve a los puntos clave, para revisarlo. */
  alUsar: () => void;
};

/**
 * Un viaje que no se alejó de su punto de partida es una prueba de escritorio:
 * el GPS de un teléfono quieto deriva unos metros y no dibuja ninguna calle.
 */
const EXTENSION_MINIMA_M = 300;

const FECHA = new Intl.DateTimeFormat("es-VE", { dateStyle: "medium", timeStyle: "short" });

export function PanelViajes({ viajes, editor, alUsar }: Props) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="text-sm font-extrabold">Desde un viaje grabado</h2>
      <p className="text-[13px] text-tinta-media">
        El conductor hace la ruta con la app transmitiendo y aquí se convierte en trazado: se limpia el
        ruido del GPS y la línea se pega a las calles. Queda con puntos clave, así que lo puedes
        corregir después.
      </p>

      {viajes.length === 0 ? (
        <p className="rounded-[10px] border border-dashed border-borde px-3 py-2.5 text-[13px] text-tinta-media">
          Esta ruta todavía no tiene viajes grabados.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {viajes.map((viaje) => {
            const quieto = viaje.extensionM < EXTENSION_MINIMA_M;

            return (
              <li key={viaje.id}>
                <button
                  type="button"
                  disabled={quieto || editor.ocupado !== "libre"}
                  onClick={async () => {
                    await editor.usarViaje(viaje);
                    alUsar();
                  }}
                  className="flex w-full flex-col gap-0.5 rounded-[10px] border border-borde px-3 py-2.5 text-left transition-colors duration-200 ease-out hover:bg-fondo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
                >
                  <span className="text-[13px] font-bold">{FECHA.format(new Date(viaje.iniciadoAt))}</span>
                  <span className="text-xs text-tinta-media">
                    {viaje.posiciones} lecturas · se alejó {formatearDistancia(viaje.extensionM)}
                    {viaje.finalizadoAt === null && " · sin finalizar"}
                  </span>
                  {quieto && (
                    <span className="text-xs font-semibold text-tinta-media">
                      El teléfono casi no se movió: no sirve para sacar el trazado.
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {editor.ocupado === "cargando_viaje" && (
        <p role="status" className="text-xs font-semibold text-tinta-media">
          Sacando el trazado del viaje…
        </p>
      )}
    </section>
  );
}
