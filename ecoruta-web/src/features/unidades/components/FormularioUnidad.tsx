"use client";

import { useActionState, useEffect, useRef } from "react";
import { Campo } from "@/components/ui/Campo";
import { BOTON_PANEL_PRINCIPAL, BOTON_PANEL_SECUNDARIO } from "@/components/ui/estilos-panel";
import type { UnidadConRuta } from "@/services/unidades.service";
import { agregarUnidad, editarUnidad, type EstadoUnidades } from "../acciones";

export type OpcionDeRuta = {
  id: string;
  nombre: string;
};

type Props = {
  rutas: readonly OpcionDeRuta[];
  /** Presente al editar. Ausente al crear. */
  unidad?: UnidadConRuta;
  onCancelar: () => void;
  onGuardada: (unidadId: string) => void;
};

const ESTADO_INICIAL: EstadoUnidades = {};

export function FormularioUnidad({ rutas, unidad, onCancelar, onGuardada }: Props) {
  const accion = unidad ? editarUnidad : agregarUnidad;
  const [estado, enviar, enviando] = useActionState(
    async (previo: EstadoUnidades, datos: FormData) => {
      const resultado = await accion(previo, datos);
      if (resultado.guardada) {
        onGuardada(resultado.guardada);
      }
      return resultado;
    },
    ESTADO_INICIAL,
  );
  const titulo = useRef<HTMLHeadingElement>(null);

  // El panel se abre lejos del botón que lo pidió: el foco tiene que ir con él.
  useEffect(() => {
    titulo.current?.focus();
  }, []);

  return (
    <section aria-labelledby="titulo-formulario-unidad" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2
          ref={titulo}
          id="titulo-formulario-unidad"
          tabIndex={-1}
          className="text-[19px] leading-tight font-extrabold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo"
        >
          {unidad ? `Editar ${unidad.nombre}` : "Nueva unidad"}
        </h2>
        <p className="text-[13px] leading-relaxed text-tinta-media">
          El servicio que presta lo define su ruta. Sin ruta asignada, la unidad no aparece en
          el mapa del ciudadano.
        </p>
      </div>

      <form action={enviar} className="flex flex-col gap-4">
        {unidad && <input type="hidden" name="unidadId" value={unidad.id} />}

        <Campo
          etiqueta="Nombre o número"
          name="nombre"
          id="nombre-unidad"
          required
          placeholder="Unidad 04"
          defaultValue={unidad?.nombre ?? ""}
        />

        <div className="flex flex-col gap-2">
          <label htmlFor="ruta-unidad" className="text-xs font-bold tracking-wide text-tinta-suave">
            Ruta asignada
          </label>
          <select
            id="ruta-unidad"
            name="rutaId"
            defaultValue={unidad?.rutaId ?? ""}
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

        <div className="flex gap-2">
          <button type="submit" disabled={enviando} className={`${BOTON_PANEL_PRINCIPAL} flex-1`}>
            {enviando ? "Guardando…" : unidad ? "Guardar cambios" : "Crear unidad"}
          </button>
          <button type="button" onClick={onCancelar} disabled={enviando} className={BOTON_PANEL_SECUNDARIO}>
            Cancelar
          </button>
        </div>
      </form>
    </section>
  );
}
