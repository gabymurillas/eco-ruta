import { formatearDistancia } from "@/domain/formato";
import type { ParadaConRutas } from "../types";

type Props = {
  paradas: readonly ParadaConRutas[];
  elegidaId: string;
  alElegir: (parada: ParadaConRutas) => void;
};

export const ID_OTRAS_PARADAS = "otras-paradas";

/**
 * Cambiar de parada entre las cercanas sin salir de la vista. La elegida se
 * marca con terracota: es un acento de navegación («estás aquí»), no un estado
 * ni una ruta.
 */
export function OtrasParadas({ paradas, elegidaId, alElegir }: Props) {
  return (
    <section id={ID_OTRAS_PARADAS} aria-labelledby="titulo-otras-paradas" className="flex scroll-mt-4 flex-col gap-1">
      <h3 id="titulo-otras-paradas" className="text-[0.9375rem] font-bold">
        Cambiar de parada
      </h3>

      <ul className="flex flex-col">
        {paradas.map((parada) => {
          const elegida = parada.paradaId === elegidaId;

          return (
            <li key={parada.paradaId} className="border-b border-borde-suave last:border-b-0">
              <button
                type="button"
                aria-pressed={elegida}
                onClick={() => alElegir(parada)}
                className="flex min-h-14 w-full items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo"
              >
                <span
                  aria-hidden="true"
                  className={`flex size-[22px] shrink-0 items-center justify-center rounded-full border-[1.5px] ${
                    elegida ? "border-marca-profundo" : "border-borde"
                  }`}
                >
                  {elegida && <span className="size-3 rounded-full bg-marca-profundo" />}
                </span>
                <span className="flex flex-1 flex-col">
                  <span className="text-[0.9375rem] font-bold">{parada.nombre}</span>
                  <span className="text-xs text-tinta-media">{describirRutas(parada.rutas.length)}</span>
                </span>
                <span className="text-[0.8125rem] tabular-nums text-tinta-media">
                  {formatearDistancia(parada.distanciaM)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function describirRutas(cantidad: number): string {
  if (cantidad === 0) {
    return "Todavía no pasa ninguna ruta";
  }

  return cantidad === 1 ? "1 ruta" : `${cantidad} rutas`;
}
