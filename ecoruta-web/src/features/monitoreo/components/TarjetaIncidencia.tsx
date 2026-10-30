import { Tarjeta } from "@/components/ui/Tarjeta";
import { colorDeRuta } from "@/domain/colores";
import { describirUltimaSenal } from "@/domain/flota";
import { etiquetarTipoIncidencia } from "@/domain/incidencias";
import type { IncidenciaActiva } from "@/services/incidencias.service";

type Props = {
  incidencia: IncidenciaActiva;
};

export function TarjetaIncidencia({ incidencia }: Props) {
  const reportada = describirUltimaSenal(incidencia.segundosDesdeReporte);

  return (
    <Tarjeta tono="advertencia" className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-serif text-sm font-bold">
          {etiquetarTipoIncidencia(incidencia.tipo)}
        </span>
        <span className="shrink-0 text-xs font-semibold text-tinta-suave">{reportada}</span>
      </div>

      <div className="flex items-center gap-2 text-xs font-semibold text-tinta-media">
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
      </div>

      {incidencia.descripcion && (
        <p className="text-sm leading-snug">{incidencia.descripcion}</p>
      )}
    </Tarjeta>
  );
}
