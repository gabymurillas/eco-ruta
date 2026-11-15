import type { ReactNode } from "react";
import { estimarCaminataMinutos, formatearDistancia, formatearMinutos } from "@/domain/formato";
import type { EstadoCaminata } from "../hooks/useCaminata";

/**
 * Sin ubicación no hay desde dónde trazar el camino, pero la opción no desaparece:
 * se ofrece compartirla. Desaparecer en silencio era lo que hacía creer que la
 * función a veces no estaba.
 */
export type AccesoCaminata =
  | {
      tipo: "con_ubicacion";
      /** En línea recta desde donde está ahora: se actualiza mientras camina. */
      distanciaM: number;
      estado: EstadoCaminata;
      alPedir: () => void;
      alOcultar: () => void;
    }
  | {
      tipo: "sin_ubicacion";
      estado: "sin_pedir" | "pidiendo" | "negada" | "fallida";
      alPedirUbicacion: () => void;
    };

type Props = {
  /** Null solo si el navegador no tiene geolocalización: no hay nada que ofrecer. */
  caminata: AccesoCaminata | null;
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
export function ComoLlegar({ caminata }: Props) {
  if (caminata === null) {
    return null;
  }

  if (caminata.tipo === "sin_ubicacion") {
    return <SinUbicacion estado={caminata.estado} alPedirUbicacion={caminata.alPedirUbicacion} />;
  }

  if (caminata.estado.tipo === "lista") {
    return <CaminoListo {...caminata.estado.caminata} alOcultar={caminata.alOcultar} />;
  }

  const cargando = caminata.estado.tipo === "cargando";

  return (
    <Linea
      texto={`A ${formatearDistancia(caminata.distanciaM)} · ${estimarCaminataMinutos(caminata.distanciaM)} min a pie`}
      error={caminata.estado.tipo === "error" ? caminata.estado.mensaje : null}
    >
      <button type="button" onClick={caminata.alPedir} disabled={cargando} className={ACCION}>
        <IconoCaminar />
        {cargando ? "Buscando…" : "Cómo llegar"}
      </button>
    </Linea>
  );
}

/**
 * Tocar «Cómo llegar» pide la ubicación; cuando llega, la línea pasa a la
 * distancia con su propio «Cómo llegar». Tras un «no», el navegador ya no vuelve
 * a preguntar: solo queda decir dónde activarla.
 */
function SinUbicacion({
  estado,
  alPedirUbicacion,
}: {
  estado: "sin_pedir" | "pidiendo" | "negada" | "fallida";
  alPedirUbicacion: () => void;
}) {
  if (estado === "negada") {
    return (
      <p className="text-[0.8125rem] font-semibold text-tinta-suave">
        Para ver cómo llegar a pie, permite la ubicación en tu navegador.
      </p>
    );
  }

  const pidiendo = estado === "pidiendo";

  return (
    <Linea
      texto={pidiendo ? "Buscando tu ubicación…" : "Comparte tu ubicación para ver el camino"}
      error={estado === "fallida" ? "No pudimos ubicarte. Intenta de nuevo." : null}
    >
      <button type="button" onClick={alPedirUbicacion} disabled={pidiendo} className={ACCION}>
        <IconoCaminar />
        {pidiendo ? "Ubicando…" : "Cómo llegar"}
      </button>
    </Linea>
  );
}

function Linea({ texto, error, children }: { texto: string; error: string | null; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      {/* Con letra grande el botón baja a su propia línea en vez de partir el texto. */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-3">
        <span className="text-[0.8125rem] font-semibold text-tinta-suave" role="status">
          {texto}
        </span>
        {children}
      </div>

      {error && (
        <p className="text-[0.8125rem] text-error" role="alert">
          {error}
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
