"use client";

import { useActionState } from "react";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { agregarUnidad, type EstadoUnidades } from "../acciones";

export type OpcionDeRuta = {
  id: string;
  nombre: string;
};

type Props = {
  rutas: readonly OpcionDeRuta[];
};

const ESTADO_INICIAL: EstadoUnidades = {};

export function FormularioUnidad({ rutas }: Props) {
  const [estado, enviar, enviando] = useActionState(agregarUnidad, ESTADO_INICIAL);

  return (
    <Tarjeta className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-[15px] font-bold">Nueva unidad</h2>
        <p className="text-xs leading-relaxed text-tinta-media">
          El servicio que presta lo define su ruta, no la unidad. Sin ruta asignada no
          aparece en el mapa del ciudadano.
        </p>
      </div>

      <form action={enviar} className="flex flex-col gap-4">
        <Campo
          etiqueta="Nombre o número"
          name="nombre"
          id="nombre-unidad"
          required
          placeholder="Unidad 04"
        />

        <div className="flex flex-col gap-2">
          <label
            htmlFor="rutaId"
            className="text-xs font-bold tracking-wide text-tinta-suave"
          >
            Ruta asignada
          </label>

          <select
            id="rutaId"
            name="rutaId"
            defaultValue=""
            className="h-12 rounded-[10px] border-[0.5px] border-borde-campo bg-superficie px-3 text-[15px] font-semibold text-tinta focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-marca-profundo"
          >
            <option value="">Sin asignar</option>
            {rutas.map((ruta) => (
              <option key={ruta.id} value={ruta.id}>
                {ruta.nombre}
              </option>
            ))}
          </select>
        </div>

        {estado.error && (
          <p role="alert" className="text-[13px] font-semibold text-error">
            {estado.error}
          </p>
        )}

        <Boton type="submit" disabled={enviando}>
          {enviando ? "Creando…" : "Crear unidad"}
        </Boton>
      </form>
    </Tarjeta>
  );
}
