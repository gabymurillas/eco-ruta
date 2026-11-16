import { colorDeRutaAdaptable } from "@/domain/colores";
import type { ParadaDelRecorrido } from "@/domain/recorrido";
import { EstadoDeParada } from "./EstadoDeParada";

type Props = {
  paradas: readonly ParadaDelRecorrido[];
  miParadaId: string | null;
  color: string;
  horario: string | null;
};

/**
 * Las paradas en el orden del trazado, unidas por una línea del color de la
 * ruta. La línea es decoración (el nombre de la ruta ya está en la cabecera);
 * el orden lo da la lista numerada y los extremos se dicen con texto.
 */
export function ListaParadas({ paradas, miParadaId, color, horario }: Props) {
  const ninguna = paradas.every((parada) => parada.proxima === null);

  return (
    <section aria-labelledby="titulo-paradas" className="flex flex-col gap-3">
      <h2 id="titulo-paradas" className="text-[0.9375rem] font-bold">
        Paradas de la ruta
      </h2>

      {ninguna && (
        <p className="text-sm leading-relaxed text-tinta-media">
          Ninguna unidad de esta ruta está en recorrido ahora.
          {horario && ` Horario: ${horario}.`}
        </p>
      )}

      <ol className="flex flex-col">
        {paradas.map((parada, indice) => (
          <FilaParada
            key={parada.paradaId}
            parada={parada}
            esMiParada={parada.paradaId === miParadaId}
            extremo={extremoDe(indice, paradas.length)}
            color={color}
          />
        ))}
      </ol>
    </section>
  );
}

type Extremo = "primera" | "ultima" | null;

function extremoDe(indice: number, total: number): Extremo {
  if (indice === 0) {
    return "primera";
  }

  return indice === total - 1 ? "ultima" : null;
}

const TEXTO_EXTREMO: Record<Exclude<Extremo, null>, string> = {
  primera: "Primera parada",
  ultima: "Última parada",
};

type PropsFila = {
  parada: ParadaDelRecorrido;
  esMiParada: boolean;
  extremo: Extremo;
  color: string;
};

function FilaParada({ parada, esMiParada, extremo, color }: PropsFila) {
  const tono = colorDeRutaAdaptable(color);
  const unidad = parada.proxima?.tiempo.tipo === "minutos" ? parada.proxima.unidadNombre : null;

  return (
    <li className="flex gap-3.5">
      <span aria-hidden="true" className="flex w-6 shrink-0 flex-col items-center">
        <span
          className={`mt-1 block shrink-0 rounded-full border-solid bg-superficie ${esMiParada ? "size-4 border-4" : "size-3 border-[2.5px]"}`}
          style={{ borderColor: tono }}
        />
        {extremo !== "ultima" && <span className="block w-0.5 flex-1" style={{ backgroundColor: tono }} />}
      </span>

      <div
        className={`mb-3 flex min-w-0 flex-1 items-start justify-between gap-3 ${esMiParada ? "rounded-xl border border-borde bg-marca-tenue px-3 py-2.5" : "pb-2"}`}
      >
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[0.9375rem] font-bold leading-snug break-words">{parada.nombre}</span>
          <Marcas esMiParada={esMiParada} detalle={[extremo && TEXTO_EXTREMO[extremo], unidad].filter(Boolean).join(" · ")} />
        </div>
        <EstadoDeParada proxima={parada.proxima} />
      </div>
    </li>
  );
}

/** «Tu parada» en terracota: marca lo que es del ciudadano, no un estado. */
function Marcas({ esMiParada, detalle }: { esMiParada: boolean; detalle: string }) {
  if (!esMiParada && !detalle) {
    return null;
  }

  return (
    <span className="text-xs font-semibold text-tinta-suave">
      {esMiParada && <span className="font-bold text-marca-profundo">Tu parada</span>}
      {esMiParada && detalle && " · "}
      {detalle}
    </span>
  );
}
