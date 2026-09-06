import { colorDeRuta } from "@/domain/colores";
import type { ViajesPorDia } from "@/services/historicos.service";

type Props = {
  filas: readonly ViajesPorDia[];
};

const ALTURA_MAXIMA_PX = 140;

/**
 * Barras agrupadas por día. Se dibujan con divs y no con una librería de gráficos:
 * son cinco días y tres rutas, y una dependencia más habría que justificarla.
 *
 * El color viene de la ruta, pero cada barra lleva su valor en el texto accesible:
 * el color nunca es el único portador de significado.
 */
export function GraficoViajesPorDia({ filas }: Props) {
  const dias = agruparPorDia(filas);
  const maximo = Math.max(1, ...filas.map((fila) => fila.viajes));
  const rutas = rutasPresentes(filas);

  if (filas.length === 0) {
    return (
      <p className="text-sm text-tinta-media">
        No hubo viajes registrados en este período.
      </p>
    );
  }

  return (
    <figure className="flex flex-col gap-4">
      <figcaption className="sr-only">
        Viajes completados por día, separados por ruta
      </figcaption>

      <ul className="flex flex-wrap gap-3.5">
        {rutas.map((ruta) => (
          <li key={ruta.id} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="size-2 rounded-sm"
              style={{ backgroundColor: colorDeRuta(ruta.color) }}
            />
            <span className="text-xs font-semibold text-tinta-media">{ruta.nombre}</span>
          </li>
        ))}
      </ul>

      <div className="flex items-end gap-6" style={{ height: ALTURA_MAXIMA_PX + 28 }}>
        {dias.map(({ dia, barras }) => (
          <div key={dia} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="flex w-full items-end justify-center gap-1.5"
              style={{ height: ALTURA_MAXIMA_PX }}
            >
              {barras.map((barra) => (
                <div
                  key={barra.ruta_id}
                  title={`${barra.ruta_nombre}: ${barra.viajes} viajes`}
                  className="w-5 rounded-t"
                  style={{
                    height: Math.max(4, (barra.viajes / maximo) * ALTURA_MAXIMA_PX),
                    backgroundColor: colorDeRuta(barra.ruta_color),
                  }}
                >
                  <span className="sr-only">
                    {barra.ruta_nombre}: {barra.viajes} viajes
                  </span>
                </div>
              ))}
            </div>

            <span className="text-xs font-semibold text-tinta-suave">
              {formatearDia(dia)}
            </span>
          </div>
        ))}
      </div>
    </figure>
  );
}

function agruparPorDia(filas: readonly ViajesPorDia[]) {
  const porDia = new Map<string, ViajesPorDia[]>();

  for (const fila of filas) {
    const existentes = porDia.get(fila.dia);

    if (existentes) {
      existentes.push(fila);
    } else {
      porDia.set(fila.dia, [fila]);
    }
  }

  return [...porDia.entries()].map(([dia, barras]) => ({ dia, barras }));
}

function rutasPresentes(filas: readonly ViajesPorDia[]) {
  const rutas = new Map<string, { id: string; nombre: string; color: string }>();

  for (const fila of filas) {
    rutas.set(fila.ruta_id, {
      id: fila.ruta_id,
      nombre: fila.ruta_nombre,
      color: fila.ruta_color,
    });
  }

  return [...rutas.values()];
}

function formatearDia(dia: string): string {
  return new Date(`${dia}T00:00:00`).toLocaleDateString("es-VE", {
    weekday: "short",
    day: "numeric",
  });
}
