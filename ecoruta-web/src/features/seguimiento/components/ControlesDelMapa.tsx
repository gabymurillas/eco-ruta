import type { RutaEnParada } from "../types";
import { CirculoRuta } from "./CirculoRuta";

const BOTON_REDONDO =
  "flex size-12 items-center justify-center rounded-full border border-borde bg-superficie text-tinta hover:bg-marca-tenue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo";

/**
 * Lleva el mapa a donde está el ciudadano, para que no se pierda después de
 * explorar. Relleno cuando el mapa ya lo está siguiendo, como en los mapas que
 * el ciudadano ya conoce.
 */
export function BotonMiUbicacion({ activo, alTocar }: { activo: boolean; alTocar: () => void }) {
  return (
    <button
      type="button"
      onClick={alTocar}
      aria-label="Ir a mi ubicación"
      aria-pressed={activo}
      className={BOTON_REDONDO}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="7" />
        <circle cx="12" cy="12" r="2.5" fill={activo ? "currentColor" : "none"} />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      </svg>
    </button>
  );
}

type PropsAviso = {
  ruta: RutaEnParada;
  unidadNombre: string | null;
  /** El ciudadano movió el mapa: la cámara ya no acompaña a la unidad. */
  suelto: boolean;
  alVolver: () => void;
  alCerrar: () => void;
};

/**
 * Franja sobre el mapa mientras se sigue una ruta: qué se está viendo, cómo
 * volver a la unidad si se movió el mapa y cómo salir.
 */
export function AvisoSiguiendo({ ruta, unidadNombre, suelto, alVolver, alCerrar }: PropsAviso) {
  const puedeVolver = suelto && unidadNombre !== null;
  // Con el botón de volver a la vista no cabe la segunda línea: el botón ya dice qué pasó.
  const detalle = unidadNombre ? `Siguiendo a ${unidadNombre}` : "Ninguna unidad en camino ahora";

  return (
    <div
      role="status"
      className="flex max-w-full items-center gap-2.5 rounded-full border border-borde bg-superficie py-1.5 pr-1.5 pl-2"
    >
      <CirculoRuta color={ruta.color} icono={ruta.icono} />

      <span className="flex min-w-0 flex-col">
        <span className="truncate text-[14px] font-extrabold leading-tight">{ruta.nombre}</span>
        {!puedeVolver && (
          <span className="truncate text-xs font-semibold text-tinta-suave">{detalle}</span>
        )}
      </span>

      {puedeVolver && (
        <button
          type="button"
          onClick={alVolver}
          aria-label="Volver a la unidad"
          className="h-10 shrink-0 rounded-full px-3 text-[13px] font-bold text-marca-profundo hover:bg-marca-tenue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo"
        >
          Volver
        </button>
      )}

      <button
        type="button"
        onClick={alCerrar}
        aria-label={`Dejar de seguir ${ruta.nombre}`}
        className="flex size-10 shrink-0 items-center justify-center rounded-full text-tinta-media hover:bg-marca-tenue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
  );
}
