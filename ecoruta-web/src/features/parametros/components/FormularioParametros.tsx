"use client";

import { useActionState } from "react";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { Tarjeta } from "@/components/ui/Tarjeta";
import {
  DEFINICIONES,
  radioMinimoSugeridoM,
  type DefinicionParametro,
} from "@/domain/parametros";
import { guardar, type EstadoGuardado } from "../acciones";

type Props = {
  valores: Record<string, number>;
};

const ESTADO_INICIAL: EstadoGuardado = {};

const GRUPOS = [
  {
    id: "geocercas" as const,
    titulo: "Detección de geocercas",
    descripcion:
      "Controlan cuándo se considera que una unidad llegó a una parada, y evitan que la deriva del GPS genere notificaciones repetidas.",
  },
  {
    id: "transmision" as const,
    titulo: "Transmisión y salud del equipo",
    descripcion:
      "Cada cuánto emite el teléfono de la unidad y cuándo el sistema considera que algo va mal.",
  },
];

export function FormularioParametros({ valores }: Props) {
  const [estado, enviar, enviando] = useActionState(guardar, ESTADO_INICIAL);
  const exactitud = valores.exactitud_maxima_m;

  return (
    <form action={enviar} className="flex flex-col gap-5">
      {GRUPOS.map((grupo) => (
        <Tarjeta key={grupo.id} className="flex flex-col gap-5 p-6">
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-base font-bold">{grupo.titulo}</h2>
            <p className="text-xs leading-relaxed text-tinta-media">
              {grupo.descripcion}
            </p>
          </div>

          <div className="h-px bg-borde-suave" />

          {DEFINICIONES.filter((definicion) => definicion.grupo === grupo.id).map(
            (definicion) => (
              <FilaParametro
                key={definicion.clave}
                definicion={definicion}
                valor={valores[definicion.clave]}
                error={estado.erroresPorClave?.[definicion.clave]}
              />
            ),
          )}
        </Tarjeta>
      ))}

      {exactitud !== undefined && (
        <Tarjeta tono="marca" className="flex flex-col gap-1">
          <span className="text-[13px] font-bold">
            Radio mínimo sugerido para las geocercas: {radioMinimoSugeridoM(exactitud)} m
          </span>
          <span className="text-xs leading-relaxed text-tinta-media">
            Es el doble de la exactitud máxima. Un radio menor que la exactitud del GPS
            puede no dispararse nunca. El editor de rutas arranca en este valor.
          </span>
        </Tarjeta>
      )}

      <div className="flex items-center gap-4">
        <Boton type="submit" disabled={enviando}>
          {enviando ? "Guardando…" : "Guardar cambios"}
        </Boton>

        {estado.error && (
          <span role="alert" className="text-[13px] font-semibold text-error">
            {estado.error}
          </span>
        )}

        {estado.guardadoEn && !estado.error && (
          <span role="status" className="text-[13px] font-semibold text-exito">
            Parámetros guardados.
          </span>
        )}
      </div>
    </form>
  );
}

type FilaProps = {
  definicion: DefinicionParametro;
  valor: number | undefined;
  error?: string;
};

function FilaParametro({ definicion, valor, error }: FilaProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
      <div className="flex flex-1 flex-col gap-1">
        <span className="text-sm font-bold">{definicion.titulo}</span>
        <span className="text-xs leading-relaxed text-tinta-media">
          {definicion.explicacion}
        </span>
      </div>

      <div className="flex w-40 shrink-0 items-end gap-2">
        <Campo
          etiqueta={`${definicion.titulo} (${definicion.unidad})`}
          name={definicion.clave}
          id={definicion.clave}
          type="number"
          inputMode="numeric"
          defaultValue={valor}
          min={definicion.minimo}
          max={definicion.maximo}
          error={error}
          className="w-full text-center font-serif text-[17px] font-black"
        />
      </div>
    </div>
  );
}
