import { colorDeRuta } from "@/domain/colores";
import { describirUltimaSenal } from "@/domain/flota";
import { etiquetarTipoIncidencia } from "@/domain/incidencias";
import type { IncidenciaActiva } from "@/services/incidencias.service";

type Props = {
  incidencia: IncidenciaActiva;
};

/** Sobria: texto en tinta y el ámbar solo en el triángulo que la identifica. */
export function TarjetaIncidencia({ incidencia }: Props) {
  const reportada = describirUltimaSenal(incidencia.segundosDesdeReporte);

  return (
    <article className="flex gap-3 rounded-xl border border-borde bg-superficie p-3.5">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-0.5 shrink-0 text-advertencia"
        aria-hidden="true"
      >
        <path d="M12 3l9 16H3zM12 10v4M12 17v.1" />
      </svg>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-sm font-bold">{etiquetarTipoIncidencia(incidencia.tipo)}</h3>
          {reportada && (
            <span className="shrink-0 text-xs text-tinta-suave">{reportada}</span>
          )}
        </div>

        <p className="flex items-center gap-2 text-[13px] text-tinta-media">
          {incidencia.rutaColor && (
            <span
              aria-hidden="true"
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: colorDeRuta(incidencia.rutaColor) }}
            />
          )}
          <span className="truncate">
            {incidencia.rutaNombre ?? "Ruta eliminada"}
            {incidencia.unidadNombre && ` · ${incidencia.unidadNombre}`}
          </span>
        </p>

        {incidencia.descripcion && (
          <p className="text-[13px] leading-snug">«{incidencia.descripcion}»</p>
        )}
      </div>
    </article>
  );
}
