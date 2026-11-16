import Link from "next/link";

type Props = {
  enVivo: boolean;
};

/**
 * Franja delgada sobre el mapa: la marca a la izquierda y, a la derecha, si hay
 * alguna unidad transmitiendo hacia la parada. «En vivo» es un estado, no
 * identidad: por regla del sistema usa verde, nunca terracota.
 */
export function Cabecera({ enVivo }: Props) {
  return (
    <header className="z-[1100] box-content flex h-14 shrink-0 items-center justify-between gap-3 border-b border-borde bg-superficie px-5 pt-[env(safe-area-inset-top)]">
      <span className="flex items-baseline gap-2">
        <span aria-hidden="true" className="size-2 self-center rounded-full bg-marca" />
        <span className="text-[1.125rem] font-extrabold tracking-tight">EcoRuta</span>
        <span className="hidden text-xs font-semibold text-tinta-suave sm:inline">
          San Juan de los Morros
        </span>
      </span>

      <span className="flex shrink-0 items-center gap-1">
        {enVivo && (
          <span className="flex min-h-8 shrink-0 items-center gap-2 rounded-full border border-borde px-3 whitespace-nowrap">
            <span aria-hidden="true" className="pulso-en-vivo size-[7px] rounded-full bg-exito" />
            <span className="text-[0.8125rem] font-bold">En vivo</span>
          </span>
        )}
        <EnlaceConoce />
      </span>
    </header>
  );
}

/**
 * Ícono y no texto: la cabecera es delgada y en un teléfono el «En vivo» ya
 * ocupa la derecha. El margen negativo da los 48 px táctiles sin engordarla.
 */
function EnlaceConoce() {
  return (
    <Link
      href="/conoce"
      aria-label="Conoce EcoRuta"
      title="Conoce EcoRuta"
      className="-mr-3 flex size-12 items-center justify-center rounded-full text-tinta-media transition-colors duration-300 ease-out hover:bg-marca-tenue hover:text-tinta focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-marca-profundo"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" />
      </svg>
    </Link>
  );
}
