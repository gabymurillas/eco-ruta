import { estimarCaminataMinutos, formatearDistancia, formatearMinutos } from "@/domain/formato";
import type { EstadoCaminata } from "../hooks/useCaminata";

export type AccionesCaminata = {
  estado: EstadoCaminata;
  alPedir: () => void;
  alOcultar: () => void;
};

type Props = {
  /** En línea recta; null si esta vez no compartió ubicación. */
  distanciaM: number | null;
  /** Null sin ubicación: no hay desde dónde trazar el camino. */
  caminata: AccionesCaminata | null;
};

const SEGUNDOS_POR_MINUTO = 60;

// 48 px de alto para el dedo, con margen negativo para no agrandar la línea.
const ACCION =
  "-my-3 -mr-3 flex h-12 shrink-0 items-center gap-1.5 rounded-full px-3 text-[0.875rem] font-bold text-marca-profundo hover:bg-marca-tenue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo disabled:opacity-60";

/**
 * La línea bajo el nombre de la parada: a cuánto queda y, al lado, «Cómo
 * llegar». Vive en la misma línea que la distancia para no empujar la llegada
 * más próxima fuera de la hoja baja. Con el camino pedido, la línea pasa a
 * decir lo que se camina por la calle.
 */
export function ComoLlegar({ distanciaM, caminata }: Props) {
  if (distanciaM === null) {
    return null;
  }

  if (caminata?.estado.tipo === "lista") {
    return <CaminoListo {...caminata.estado.caminata} alOcultar={caminata.alOcultar} />;
  }

  const cargando = caminata?.estado.tipo === "cargando";

  return (
    <div className="flex flex-col gap-1">
      {/* Con letra grande el botón baja a su propia línea en vez de partir la distancia. */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-3">
        <span className="text-[0.8125rem] font-semibold text-tinta-suave">
          A {formatearDistancia(distanciaM)} · {estimarCaminataMinutos(distanciaM)} min a pie
        </span>

        {caminata && (
          <button type="button" onClick={caminata.alPedir} disabled={cargando} className={ACCION}>
            <IconoCaminar />
            {cargando ? "Buscando…" : "Cómo llegar"}
          </button>
        )}
      </div>

      {caminata?.estado.tipo === "error" && (
        <p className="text-[0.8125rem] text-error" role="alert">
          {caminata.estado.mensaje}
        </p>
      )}
    </div>
  );
}

function CaminoListo({
  distanciaM,
  duracionS,
  alOcultar,
}: {
  distanciaM: number;
  duracionS: number;
  alOcultar: () => void;
}) {
  const minutos = Math.max(1, Math.round(duracionS / SEGUNDOS_POR_MINUTO));

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-3" role="status">
        <span className="flex min-w-0 items-center gap-1.5 text-[0.8125rem] font-semibold">
          <IconoCaminar />
          <span>
            <strong className="font-extrabold">{formatearMinutos(minutos)} a pie</strong> ·{" "}
            {formatearDistancia(distanciaM)} por la calle
          </span>
        </span>
        <button type="button" onClick={alOcultar} className={ACCION}>
          Ocultar
        </button>
      </div>
      {/* Atribución que exige el plan gratuito del servicio de caminos. */}
      <span className="text-[0.6875rem] font-semibold text-tinta-suave">
        Camino: © openrouteservice.org by HeiGIT · datos © OpenStreetMap
      </span>
    </div>
  );
}

function IconoCaminar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      <circle cx="13" cy="4" r="2" />
      <path d="m9 21 2-6 3 3v3M7 12l2-4 4-1 3 4 3 1M11 15l-1-4" />
    </svg>
  );
}
