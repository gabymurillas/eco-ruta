"use client";

import { useActionState, useState } from "react";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { IconoRuta } from "@/components/ui/IconoRuta";
import { Tarjeta } from "@/components/ui/Tarjeta";
import {
  colorDeRuta,
  nombreDeColor,
  TOKENS_DE_COLOR,
  tintaSobreColorDeRuta,
} from "@/domain/colores";
import { ICONOS_DISPONIBLES, ICONO_POR_DEFECTO, nombreDeIcono } from "@/domain/iconos";
import { guardarRuta, type EstadoRuta } from "../acciones";

export type DatosDeRuta = {
  id: string;
  nombre: string;
  tipo: string | null;
  icono: string | null;
  color: string;
  horario: string | null;
};

type Props = {
  /** Presente al editar. Ausente al crear. */
  ruta?: DatosDeRuta;
  /** Colores que ya usan las demás rutas, para no repetir sin darse cuenta. */
  coloresEnUso?: readonly { color: string; ruta: string }[];
};

const ESTADO_INICIAL: EstadoRuta = {};

export function FormularioRuta({ ruta, coloresEnUso = [] }: Props) {
  const [estado, enviar, enviando] = useActionState(guardarRuta, ESTADO_INICIAL);
  const [color, setColor] = useState(ruta?.color ?? TOKENS_DE_COLOR[0]);
  const [icono, setIcono] = useState<string>(ruta?.icono ?? ICONO_POR_DEFECTO);

  return (
    <form action={enviar} className="flex max-w-2xl flex-col gap-6">
      {/* La accion decide entre crear y actualizar segun venga o no este id. */}
      {ruta && <input type="hidden" name="id" value={ruta.id} />}
      <input type="hidden" name="color" value={color} />
      <input type="hidden" name="icono" value={icono} />

      <Campo
        etiqueta="Nombre de la ruta"
        name="nombre"
        required
        placeholder="Centro–UNERG"
        defaultValue={ruta?.nombre}
      />

      <Campo
        etiqueta="Tipo de servicio"
        name="tipo"
        placeholder="transporte"
        defaultValue={ruta?.tipo ?? ""}
        ayuda="Texto libre: escribe el servicio que sea (transporte, aseo, agua, gas). No hay lista cerrada."
      />

      <fieldset className="flex flex-col gap-2.5">
        <legend className="pb-1 text-xs font-bold tracking-wide text-tinta-suave">
          Color en el mapa
        </legend>

        <div className="flex gap-2.5">
          {TOKENS_DE_COLOR.map((token) => {
            const elegido = token === color;
            const usadoPor = coloresEnUso
              .filter((uso) => uso.color.toLowerCase() === token)
              .map((uso) => uso.ruta);
            const nombre = nombreDeColor(token);
            const descripcion =
              usadoPor.length > 0 ? `En uso por ${usadoPor.join(", ")}` : undefined;

            return (
              <div key={token} className="flex w-16 flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => setColor(token)}
                  aria-pressed={elegido}
                  aria-label={descripcion ? `${nombre}. ${descripcion}` : nombre}
                  title={descripcion}
                  className={`flex h-12 w-16 items-center justify-center rounded-[10px] transition-[border-color] duration-300 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo ${
                    elegido ? "border-2 border-tinta" : "border-[0.5px] border-borde"
                  }`}
                  style={{ backgroundColor: colorDeRuta(token) }}
                >
                  {elegido && (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={tintaSobreColorDeRuta(token)}
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                  )}
                </button>
                <span aria-hidden="true" className="text-center text-[11px] font-semibold">
                  {nombre}
                </span>
                {descripcion && (
                  <span aria-hidden="true" className="text-[11px] font-semibold text-tinta-suave">
                    en uso
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-xs leading-relaxed text-tinta-media">
          Cinco tonos que se distinguen entre sí, no cinco variantes del mismo color: el
          gestor identifica cada unidad en el mapa por su tono. Repetir un color se puede,
          pero dos rutas del mismo tono se confunden en el mapa.
        </p>
      </fieldset>

      <fieldset className="flex flex-col gap-2.5">
        <legend className="pb-1 text-xs font-bold tracking-wide text-tinta-suave">
          Ícono del marcador
        </legend>

        <div className="flex gap-2.5">
          {ICONOS_DISPONIBLES.map((disponible) => {
            const elegido = disponible === icono;

            return (
              <button
                key={disponible}
                type="button"
                onClick={() => setIcono(disponible)}
                aria-pressed={elegido}
                className={`flex h-15 w-16 flex-col items-center justify-center gap-1 rounded-[10px] transition-colors duration-300 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo ${
                  elegido
                    ? "border-2 border-marca-profundo bg-marca-tenue text-marca-profundo"
                    : "border-[0.5px] border-borde text-tinta-media"
                }`}
              >
                <IconoRuta icono={disponible} tamano={21} />
                <span className="text-[11px] font-bold">{nombreDeIcono(disponible)}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <Campo
        etiqueta="Horario"
        name="horario"
        placeholder="Lunes a viernes · 6:00 a 20:00"
        defaultValue={ruta?.horario ?? ""}
      />

      {!ruta && (
        <Tarjeta className="flex flex-col gap-1">
          <span className="text-[13px] font-bold">El trazado se dibuja después</span>
          <span className="text-xs leading-relaxed text-tinta-media">
            Guarda la ruta primero. Luego, desde «Trazado y paradas», dibujas el recorrido:
            la ruta pasa por las paradas de la ciudad que queden junto a él. Sin trazado no
            hay tiempo estimado: la distancia no puede seguir el recorrido real.
          </span>
        </Tarjeta>
      )}

      <div className="flex items-center gap-4">
        <Boton type="submit" disabled={enviando}>
          {enviando ? "Guardando…" : ruta ? "Guardar cambios" : "Guardar ruta"}
        </Boton>

        {estado.error && (
          <span role="alert" className="text-[13px] font-semibold text-error">
            {estado.error}
          </span>
        )}
      </div>
    </form>
  );
}
