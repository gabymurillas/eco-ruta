import type { ReactNode } from "react";
import { colorDeRuta } from "@/domain/colores";

export function ChipRuta({ nombre, color }: { nombre: string | null; color: string | null }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-semibold whitespace-nowrap text-tinta">
      <i
        aria-hidden="true"
        className="size-2.5 rounded-full"
        style={{ backgroundColor: color ? colorDeRuta(color) : "var(--color-borde)" }}
      />
      {nombre ?? "Ruta eliminada"}
    </span>
  );
}

/** Sobrio: fondo neutro, el color solo en el ícono, y siempre con su nombre. */
export function ChipEstado({ activa }: { activa: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-borde bg-fondo px-2.5 py-0.5 text-xs font-bold whitespace-nowrap">
      {activa ? (
        <svg width="11" height="11" viewBox="0 0 24 24" className="text-advertencia" aria-hidden="true">
          <path d="M12 2L23 21H1z" fill="currentColor" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-exito" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      )}
      {activa ? "Activa" : "Resuelta"}
    </span>
  );
}

const TRAZOS_POR_TIPO: Record<string, ReactNode> = {
  falla_mecanica: (
    <>
      <rect x="4" y="4" width="16" height="13" rx="3" />
      <path d="M4 11h16M8 20v-3M16 20v-3" />
    </>
  ),
  desvio: (
    <>
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <path d="M8.3 17C15 16 9 8 15.7 7" />
    </>
  ),
  calle_cerrada: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M7 12h10" />
    </>
  ),
  otro: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8v.1" />
    </>
  ),
};

/** Congestión y cualquier tipo nuevo usan el triángulo de advertencia. */
export function IconoTipoIncidencia({ tipo }: { tipo: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {TRAZOS_POR_TIPO[tipo] ?? (
        <>
          <path d="M12 3l9 16H3z" />
          <path d="M12 10v4M12 17v.1" />
        </>
      )}
    </svg>
  );
}
