import Link from "next/link";

type Props = {
  className?: string;
};

/**
 * La única acción de la portada: abrir el mapa. Es un enlace (navega) con la
 * forma del botón primario; por eso copia sus clases y no usa `Boton`.
 */
export function EnlaceVerMiParada({ className = "" }: Props) {
  return (
    <Link
      href="/"
      className={`inline-flex h-12 min-w-12 items-center justify-center gap-2 rounded-full bg-marca-profundo px-6 text-[0.9375rem] font-bold text-superficie transition-[filter] duration-300 ease-out hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo ${className}`}
    >
      Ver mi parada
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
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </Link>
  );
}
