import Link from "next/link";
import {
  describirReporte,
  etiquetarTipoIncidencia,
  type EstadoIncidencia,
} from "@/domain/incidencias";
import type { Incidencia } from "@/services/incidencias.service";
import { ChipEstado, ChipRuta, IconoTipoIncidencia } from "./ChipsIncidencia";

type Props = {
  incidencias: Incidencia[];
  elegidaId: string | undefined;
  /** Enlace que elige una incidencia sin perder los filtros de la URL. */
  enlaceDe: (id: string) => string;
  estado: EstadoIncidencia;
  periodo: number;
};

const CELDA_CABECERA = "border-b border-borde px-4.5 py-2.5";

export function TablaIncidencias({ incidencias, elegidaId, enlaceDe, estado, periodo }: Props) {
  if (incidencias.length === 0) {
    return <p className="p-6 text-sm text-tinta-media">{textoVacio(estado, periodo)}</p>;
  }

  return (
    <table className="w-full border-collapse text-sm">
      <thead className="sticky top-0 z-10 bg-fondo">
        <tr className="text-left text-[12.5px] font-bold text-tinta-media">
          <th scope="col" className={CELDA_CABECERA}>Incidencia</th>
          <th scope="col" className={CELDA_CABECERA}>Ruta</th>
          <th scope="col" className={CELDA_CABECERA}>Estado</th>
        </tr>
      </thead>
      <tbody>
        {incidencias.map((incidencia) => (
          <FilaIncidencia
            key={incidencia.id}
            incidencia={incidencia}
            elegida={incidencia.id === elegidaId}
            href={enlaceDe(incidencia.id)}
          />
        ))}
      </tbody>
    </table>
  );
}

function FilaIncidencia({ incidencia, elegida, href }: { incidencia: Incidencia; elegida: boolean; href: string }) {
  return (
    <tr className={`border-b border-borde-suave ${elegida ? "bg-marca-tenue" : "hover:bg-fondo"}`}>
      <td className="px-4.5 py-3">
        {/* La fila entera no es enlace: una tabla con filas clicables no se
            anuncia bien al lector de pantalla. El nombre es el enlace. */}
        <Link
          href={href}
          scroll={false}
          aria-current={elegida ? "true" : undefined}
          className="flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo"
        >
          <span
            className={`grid size-9 shrink-0 place-items-center rounded-[10px] border border-borde bg-fondo ${
              incidencia.activa ? "text-advertencia" : "text-tinta-media"
            }`}
          >
            <IconoTipoIncidencia tipo={incidencia.tipo} />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="line-clamp-1 font-bold">
              {etiquetarTipoIncidencia(incidencia.tipo)}
              {incidencia.descripcion && (
                <span className="font-normal text-tinta-media"> · «{incidencia.descripcion}»</span>
              )}
            </span>
            <span className="text-[12.5px] text-tinta-media">
              {incidencia.unidadNombre ?? "Unidad eliminada"} ·{" "}
              {describirReporte(incidencia.segundosDesdeReporte, incidencia.creadaAt)}
            </span>
          </span>
        </Link>
      </td>
      <td className="px-4.5 py-3">
        <ChipRuta nombre={incidencia.rutaNombre} color={incidencia.rutaColor} />
      </td>
      <td className="px-4.5 py-3">
        <ChipEstado activa={incidencia.activa} />
      </td>
    </tr>
  );
}

function textoVacio(estado: EstadoIncidencia, periodo: number): string {
  if (estado === "activas") {
    return "No hay incidencias activas. Cuando un chofer reporte una desde el teléfono, aparece aquí.";
  }
  if (estado === "resueltas") {
    return `No se resolvió ninguna incidencia en los últimos ${periodo} días.`;
  }
  return `No hay incidencias activas ni resueltas en los últimos ${periodo} días.`;
}
