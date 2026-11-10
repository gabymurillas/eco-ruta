import { colorDeRuta } from "@/domain/colores";
import { formatearMinutos } from "@/domain/formato";

export type FilaPorRuta = {
  ruta_id: string;
  ruta_nombre: string;
  ruta_color: string;
  viajes_completados: number;
  duracion_promedio_min: number | null;
  cobertura_pct: number | null;
  incidencias: number;
  incidencias_activas: number;
};

const CABECERA = "border-b border-borde px-3 py-2.5";
const CELDA = "px-3 py-3 whitespace-nowrap";

export function TablaPorRuta({ filas }: { filas: readonly FilaPorRuta[] }) {
  if (filas.length === 0) {
    return <p className="p-5 text-sm text-tinta-media">No hay rutas activas ni actividad en el período.</p>;
  }

  return (
    <table className="w-full border-collapse text-sm">
      <caption className="sr-only">Viajes, duración, cobertura e incidencias de cada ruta en el período</caption>
      <thead className="sticky top-0 z-10 bg-fondo">
        <tr className="text-[12.5px] font-bold text-tinta-media">
          <th scope="col" className={`${CABECERA} text-left`}>Ruta</th>
          <th scope="col" className={`${CABECERA} text-right`}>Viajes</th>
          <th scope="col" className={`${CABECERA} text-right`}>Duración</th>
          <th scope="col" className={`${CABECERA} text-right`}>Cobertura</th>
          <th scope="col" className={`${CABECERA} text-right`}>
            <abbr title="Incidencias" className="no-underline">Incid.</abbr>
          </th>
        </tr>
      </thead>
      <tbody>
        {filas.map((fila) => (
          <tr key={fila.ruta_id} className="border-b border-borde-suave">
            <th scope="row" className={`${CELDA} text-left font-semibold`}>
              <span className="inline-flex items-center gap-1.5">
                <i aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: colorDeRuta(fila.ruta_color) }} />
                <span className="max-w-40 truncate">{fila.ruta_nombre}</span>
              </span>
            </th>
            <td className={`${CELDA} text-right`}>{fila.viajes_completados}</td>
            <td className={`${CELDA} text-right`}>
              {fila.duracion_promedio_min === null ? "—" : formatearMinutos(Math.round(Number(fila.duracion_promedio_min)))}
            </td>
            <td className={`${CELDA} text-right`}>
              <Cobertura pct={fila.cobertura_pct === null ? null : Number(fila.cobertura_pct)} />
            </td>
            <td className={`${CELDA} text-right`}>
              {fila.incidencias}
              {fila.incidencias_activas > 0 && (
                <span className="block text-xs text-tinta-media">
                  {fila.incidencias_activas} {fila.incidencias_activas === 1 ? "activa" : "activas"}
                </span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Sin viajes no hay paradas planificadas: la cobertura no es 0 %, no existe. */
function Cobertura({ pct }: { pct: number | null }) {
  if (pct === null) {
    return <span className="text-tinta-suave">—</span>;
  }

  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden="true" className="h-[7px] w-12 overflow-hidden rounded-full bg-borde">
        <span className="block h-full bg-marca" style={{ width: `${Math.min(100, pct)}%` }} />
      </span>
      {Math.round(pct)} %
    </span>
  );
}
