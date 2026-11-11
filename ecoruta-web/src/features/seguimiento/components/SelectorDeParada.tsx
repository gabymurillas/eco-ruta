import { Boton } from "@/components/ui/Boton";
import { colorDeRutaAdaptable } from "@/domain/colores";
import { formatearDistancia } from "@/domain/formato";
import type { ParadaConRutas } from "../types";

type Props = {
  paradas: readonly ParadaConRutas[];
  elegidaId: string | null;
  alElegir: (parada: ParadaConRutas) => void;
  /** null cuando no hay una parada a la cual volver. */
  alCancelar: (() => void) | null;
};

/**
 * La elegida se marca con terracota: es un acento de navegación («estás
 * aquí»), no un estado del sistema ni una ruta.
 */
export function SelectorDeParada({
  paradas,
  elegidaId,
  alElegir,
  alCancelar,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-[20px] font-extrabold leading-tight tracking-tight">
        Elige tu parada
      </h2>

      <ul className="flex flex-col gap-2.5">
        {paradas.map((parada) => {
          const elegida = parada.paradaId === elegidaId;

          return (
            <li key={parada.paradaId}>
              <button
                type="button"
                aria-pressed={elegida}
                onClick={() => alElegir(parada)}
                className={`flex min-h-12 w-full flex-col gap-2 rounded-2xl border bg-superficie p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo ${
                  elegida ? "border-marca bg-marca-tenue" : "border-borde-suave"
                }`}
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-[15px] font-bold">
                    {parada.nombre}
                  </span>
                  <span className="shrink-0 text-[13px] font-semibold text-tinta-suave">
                    {formatearDistancia(parada.distanciaM)}
                  </span>
                </span>
                <ChipsDeRuta parada={parada} />
              </button>
            </li>
          );
        })}
      </ul>

      {alCancelar && (
        <Boton variante="fantasma" onClick={alCancelar}>
          Cancelar
        </Boton>
      )}
    </div>
  );
}

/** Punto del color de la ruta más su nombre: nunca el punto solo. */
function ChipsDeRuta({ parada }: { parada: ParadaConRutas }) {
  if (parada.rutas.length === 0) {
    return (
      <span className="text-[13px] font-semibold text-tinta-suave">
        Todavía no pasa ninguna ruta
      </span>
    );
  }

  return (
    <span className="flex flex-wrap gap-x-3 gap-y-1">
      {parada.rutas.map((ruta) => (
        <span
          key={ruta.rutaId}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-tinta-media"
        >
          <span
            aria-hidden="true"
            className="size-2 rounded-full"
            style={{ backgroundColor: colorDeRutaAdaptable(ruta.color) }}
          />
          {ruta.nombre}
        </span>
      ))}
    </span>
  );
}
