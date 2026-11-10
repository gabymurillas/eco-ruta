import type { ReactNode } from "react";

export function IconoIngreso({
  trazo,
  grosor = 1.8,
  className = "",
}: {
  trazo: ReactNode;
  grosor?: number;
  className?: string;
}) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      {trazo}
    </svg>
  );
}

export const TRAZO_CORREO = (
  <>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </>
);

export const TRAZO_CANDADO = (
  <>
    <rect x="4" y="10" width="16" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </>
);

export const TRAZO_ERROR = (
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5M12 16v.1" />
  </>
);

/** El mismo aviso de error en las tres pantallas: ícono en rojo, texto en tinta. */
export function AvisoDeError({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-2.5 rounded-xl border border-borde bg-superficie px-4 py-3 text-sm font-semibold"
    >
      <IconoIngreso className="mt-px text-error" trazo={TRAZO_ERROR} />
      {children}
    </p>
  );
}

export const BOTON_INGRESO =
  "mt-1 flex h-[54px] w-full items-center justify-center gap-2.5 rounded-xl bg-marca-profundo text-base font-bold text-superficie transition-[filter] duration-200 ease-out hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo disabled:opacity-60";

export const ENLACE_INGRESO =
  "rounded-md font-bold text-marca focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo";
