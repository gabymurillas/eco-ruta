import Link from "next/link";
import type { ReactNode } from "react";
import {
  describirReporte,
  etiquetarTipoIncidencia,
  formatearMomento,
} from "@/domain/incidencias";
import type { Incidencia } from "@/services/incidencias.service";
import { BotonResolver } from "./BotonResolver";
import { ChipEstado, ChipRuta } from "./ChipsIncidencia";
import { MapaIncidencia } from "./MapaIncidencia";

type Props = {
  incidencia: Incidencia;
  trazado: unknown;
  penalizacionPct: number;
};

export function DetalleIncidencia({ incidencia, trazado, penalizacionPct }: Props) {
  const titulo = etiquetarTipoIncidencia(incidencia.tipo);

  return (
    <aside
      aria-label="Detalle de la incidencia"
      className="flex w-[440px] shrink-0 flex-col gap-4 overflow-y-auto rounded-2xl border border-borde bg-superficie pb-5"
    >
      <div className="flex flex-col gap-1.5 px-5 pt-5">
        <div className="flex items-center gap-2">
          <ChipEstado activa={incidencia.activa} />
          <span className="text-[12.5px] text-tinta-media">
            {describirReporte(incidencia.segundosDesdeReporte, incidencia.creadaAt)}
          </span>
        </div>
        <h2 className="mt-1 text-[21px] font-extrabold tracking-tight">{titulo}</h2>
        <p className="flex flex-wrap items-center gap-x-1.5 text-sm text-tinta-media">
          <ChipRuta nombre={incidencia.rutaNombre} color={incidencia.rutaColor} />
          <span>· reportada por {incidencia.unidadNombre ?? "una unidad eliminada"}</span>
        </p>
      </div>

      <div className="px-5">
        {incidencia.ubicacion ? (
          <MapaIncidencia
            ubicacion={incidencia.ubicacion}
            trazado={trazado}
            color={incidencia.rutaColor}
            titulo={`Lugar del reporte: ${titulo}`}
          />
        ) : (
          <p className="rounded-xl border border-dashed border-borde px-4 py-3 text-[13px] text-tinta-media">
            El teléfono no envió la ubicación con este reporte.
          </p>
        )}
      </div>

      {incidencia.descripcion && (
        <Bloque titulo="Descripción del chofer">
          <p>«{incidencia.descripcion}»</p>
        </Bloque>
      )}

      <Bloque titulo={incidencia.activa ? "Qué pasa mientras está activa" : "Efecto"}>
        <p>
          {incidencia.activa
            ? `El tiempo estimado de esta ruta suma un ${penalizacionPct} % y la web del ciudadano lo avisa en cada llegada.`
            : "Ya no afecta el tiempo estimado ni se muestra al ciudadano."}
        </p>
      </Bloque>

      <Historial incidencia={incidencia} />

      {incidencia.activa && <Acciones incidenciaId={incidencia.id} />}

      <p className="flex items-center gap-1.5 px-5 text-[12.5px] text-tinta-media">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 8v.1" />
        </svg>
        El reporte identifica a la unidad, nunca al chofer.
      </p>
    </aside>
  );
}

function Historial({ incidencia }: { incidencia: Incidencia }) {
  return (
    <Bloque titulo="Historial">
      <ol className="flex flex-col gap-2.5 text-[13.5px]">
        <Hito marcado>
          <b>Reportada</b> desde el teléfono de {incidencia.unidadNombre ?? "una unidad eliminada"}
          <small className="block text-tinta-media">{formatearMomento(incidencia.creadaAt)}</small>
        </Hito>
        {incidencia.activa ? (
          <Hito>
            <b>Pendiente de resolver</b>
            <small className="block text-tinta-media">
              Al marcarla resuelta deja de afectar el tiempo estimado
            </small>
          </Hito>
        ) : (
          <Hito marcado>
            <b>Resuelta</b>
            {incidencia.resueltaAt && (
              <small className="block text-tinta-media">{formatearMomento(incidencia.resueltaAt)}</small>
            )}
          </Hito>
        )}
      </ol>
    </Bloque>
  );
}

function Acciones({ incidenciaId }: { incidenciaId: string }) {
  return (
    <div className="flex flex-wrap items-start gap-2.5 px-5">
      <BotonResolver incidenciaId={incidenciaId} />
      <Link
        href="/admin"
        className="flex h-10 items-center gap-2 rounded-[10px] border-[1.5px] border-borde-campo px-4 text-sm font-semibold transition-colors duration-200 ease-out hover:bg-fondo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z" />
          <path d="M9 4v14M15 6v14" />
        </svg>
        Ver en el monitoreo
      </Link>
    </div>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1 px-5 text-sm">
      <h3 className="text-[13px] font-bold text-tinta-media">{titulo}</h3>
      {children}
    </section>
  );
}

function Hito({ marcado = false, children }: { marcado?: boolean; children: ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <i
        aria-hidden="true"
        className={`mt-1.5 size-2.5 shrink-0 rounded-full ${marcado ? "bg-marca-profundo" : "border-2 border-borde-campo"}`}
      />
      <div>{children}</div>
    </li>
  );
}
