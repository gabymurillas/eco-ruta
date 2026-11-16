import Link from "next/link";
import { CirculoRuta } from "@/features/seguimiento/components/CirculoRuta";
import type { RutaDelDetalle } from "./DetalleRuta";

type Props = {
  ruta: RutaDelDetalle;
  enVivo: boolean;
};

/**
 * Volver, la ruta (ícono sobre su color, siempre con su nombre) y, si alguna
 * unidad transmite, «En vivo». Como en la cabecera del mapa, «En vivo» es un
 * estado: va en verde y con texto, nunca en terracota.
 */
export function CabeceraRuta({ ruta, enVivo }: Props) {
  const detalle = [ruta.tipo, ruta.horario].filter(Boolean).join(" · ");

  return (
    <header className="border-b border-borde bg-superficie pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex min-h-[4.5rem] max-w-[1152px] items-center gap-2 py-2 pr-4 pl-1 md:pr-6 md:pl-3">
        <Link
          href="/"
          aria-label="Volver a mi parada"
          title="Volver a mi parada"
          className="flex size-12 shrink-0 items-center justify-center rounded-full text-tinta-media transition-colors duration-300 ease-out hover:bg-marca-tenue hover:text-tinta focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-marca-profundo"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
        </Link>

        <CirculoRuta color={ruta.color} icono={ruta.icono} />

        <div className="flex min-w-0 flex-1 flex-col gap-0.5 pl-1">
          <h1 className="text-[1.1875rem] font-extrabold leading-tight tracking-tight break-words">
            {ruta.nombre}
          </h1>
          {detalle && <p className="text-xs font-semibold text-tinta-suave">{detalle}</p>}
        </div>

        {enVivo && (
          <span className="flex min-h-8 shrink-0 items-center gap-2 rounded-full border border-borde px-3 whitespace-nowrap">
            <span aria-hidden="true" className="pulso-en-vivo size-[7px] rounded-full bg-exito" />
            <span className="text-[0.8125rem] font-bold">En vivo</span>
          </span>
        )}
      </div>
    </header>
  );
}
