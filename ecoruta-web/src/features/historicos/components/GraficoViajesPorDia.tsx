import { colorDeRuta } from "@/domain/colores";
import { etiquetaDiaSemana, etiquetaNumeroDia, type DiaApilado } from "@/domain/historicos";

export type RutaDelGrafico = { id: string; nombre: string; color: string };

type Props = {
  dias: readonly DiaApilado[];
  rutas: readonly RutaDelGrafico[];
};

/** Con más de una semana no caben el nombre del día ni el total sobre cada barra. */
const DIAS_CON_ROTULO_COMPLETO = 7;

/**
 * Barras apiladas por día. Se dibujan con divs y no con una librería de gráficos:
 * son pocas barras, y una dependencia más habría que justificarla.
 *
 * El color sigue a la ruta, nunca a su posición: cada ruta ocupa siempre el
 * mismo lugar de la pila. La leyenda y el detalle al pasar el mouse dicen qué
 * es cada color, y la tabla «Por ruta» trae las mismas cifras en texto.
 */
export function GraficoViajesPorDia({ dias, rutas }: Props) {
  const maximo = Math.max(1, ...dias.map((dia) => dia.total));
  const completo = dias.length <= DIAS_CON_ROTULO_COMPLETO;
  const porId = new Map(rutas.map((ruta) => [ruta.id, ruta]));

  if (dias.every((dia) => dia.total === 0)) {
    return (
      <p className="p-5 text-sm text-tinta-media">
        No hubo viajes completados en este período. Aparecen aquí cuando una unidad cierra su
        recorrido.
      </p>
    );
  }

  return (
    <figure className="flex min-h-0 flex-1 flex-col">
      <figcaption className="sr-only">Viajes completados por día, separados por ruta</figcaption>
      <Leyenda rutas={rutas} />

      <ol className={`flex min-h-56 flex-1 items-stretch px-5 pt-4 pb-4 ${completo ? "gap-6" : "gap-1"}`}>
        {dias.map((dia) => (
          <li
            key={dia.dia}
            tabIndex={0}
            className="group relative flex flex-1 flex-col items-center gap-1.5 rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo"
          >
            <div className="flex w-full flex-1 items-end justify-center border-b border-borde">
              <div
                className={`flex flex-col-reverse gap-0.5 ${completo ? "w-14" : "w-full max-w-5"}`}
                style={{ height: `${(dia.total / maximo) * 100}%` }}
              >
                {dia.segmentos.map((segmento) => (
                  <span
                    key={segmento.rutaId}
                    className="block min-h-0.5 last:rounded-t"
                    style={{
                      flexGrow: segmento.viajes,
                      backgroundColor: colorDeRuta(porId.get(segmento.rutaId)?.color ?? null),
                    }}
                  />
                ))}
              </div>
            </div>
            {completo && <b className="text-[15px] leading-none">{dia.total}</b>}
            <span className="text-[12.5px] font-semibold text-tinta-media">
              {completo ? etiquetaDiaSemana(dia.dia) : etiquetaNumeroDia(dia.dia)}
            </span>
            <Detalle dia={dia} porId={porId} />
          </li>
        ))}
      </ol>
    </figure>
  );
}

function Leyenda({ rutas }: { rutas: readonly RutaDelGrafico[] }) {
  return (
    <ul className="flex flex-wrap gap-x-3.5 gap-y-1 px-5">
      {rutas.map((ruta) => (
        <li key={ruta.id} className="flex items-center gap-1.5 text-[12.5px] font-semibold text-tinta-media">
          <i aria-hidden="true" className="size-2.5 rounded-[3px]" style={{ backgroundColor: colorDeRuta(ruta.color) }} />
          {ruta.nombre}
        </li>
      ))}
    </ul>
  );
}

/** Transparente y no oculto: el lector de pantalla lo lee siempre; a la vista, al pasar el mouse o enfocar. */
function Detalle({ dia, porId }: { dia: DiaApilado; porId: Map<string, RutaDelGrafico> }) {
  return (
    <div className="pointer-events-none absolute bottom-full z-10 mb-1 w-max max-w-56 rounded-[10px] border border-borde bg-superficie p-2.5 text-left text-xs opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
      <p className="font-bold">
        {etiquetaDiaSemana(dia.dia)} {etiquetaNumeroDia(dia.dia)}: {dia.total}{" "}
        {dia.total === 1 ? "viaje" : "viajes"}
      </p>
      {dia.segmentos.map((segmento) => (
        <p key={segmento.rutaId} className="mt-1 flex items-center gap-1.5 text-tinta-media">
          <i
            aria-hidden="true"
            className="size-2 rounded-[2px]"
            style={{ backgroundColor: colorDeRuta(porId.get(segmento.rutaId)?.color ?? null) }}
          />
          {porId.get(segmento.rutaId)?.nombre}: {segmento.viajes}
        </p>
      ))}
    </div>
  );
}
