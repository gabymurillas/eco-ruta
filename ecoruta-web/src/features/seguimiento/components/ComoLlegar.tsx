import { formatearDistancia, formatearMinutos } from "@/domain/formato";
import type { EstadoCaminata } from "../hooks/useCaminata";

type Props = {
  estado: EstadoCaminata;
  alPedir: () => void;
  alOcultar: () => void;
};

const SEGUNDOS_POR_MINUTO = 60;

const BOTON =
  "flex h-10 shrink-0 items-center gap-2 rounded-full border border-borde px-3.5 text-sm font-bold hover:bg-marca-tenue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo";

/**
 * «Cómo llegar» a pie hasta la parada: dibuja el camino por las calles en el
 * mapa y dice cuánto se camina. Solo aparece si el ciudadano compartió su
 * ubicación, porque el camino sale de ahí.
 */
export function ComoLlegar({ estado, alPedir, alOcultar }: Props) {
  if (estado.tipo === "lista") {
    const { distanciaM, duracionS } = estado.caminata;
    const minutos = Math.max(1, Math.round(duracionS / SEGUNDOS_POR_MINUTO));

    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3" role="status">
          <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
            <IconoCaminar />
            <span>
              <strong className="font-extrabold">
                {formatearMinutos(minutos)} a pie
              </strong>{" "}
              · {formatearDistancia(distanciaM)} por la calle
            </span>
          </span>
          <button type="button" onClick={alOcultar} className={BOTON}>
            Ocultar
          </button>
        </div>
        {/* Atribución que exige el plan gratuito del servicio de caminos. */}
        <span className="text-[11px] font-semibold text-tinta-suave">
          Camino: © openrouteservice.org by HeiGIT · datos © OpenStreetMap
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={alPedir}
        disabled={estado.tipo === "cargando"}
        className={`${BOTON} self-start disabled:opacity-60`}
      >
        <IconoCaminar />
        {estado.tipo === "cargando" ? "Buscando el camino…" : "Cómo llegar"}
      </button>

      {estado.tipo === "error" && (
        <p className="text-sm text-error" role="alert">
          {estado.mensaje}
        </p>
      )}
    </div>
  );
}

function IconoCaminar() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="13" cy="4" r="2" />
      <path d="m9 21 2-6 3 3v3M7 12l2-4 4-1 3 4 3 1M11 15l-1-4" />
    </svg>
  );
}
