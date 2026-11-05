import Image from "next/image";
import type { ReactNode } from "react";
import morrosPanoramico from "@/assets/morros-panoramico.jpg";
import { LogoAdmin } from "@/components/ui/LogoAdmin";

const FUNCIONES: { titulo: string; detalle: string; icono: ReactNode }[] = [
  {
    titulo: "Monitoreo en vivo",
    detalle: "Posición y señal de cada unidad",
    icono: <path d="M3 12h4l3-8 4 16 3-8h4" />,
  },
  {
    titulo: "Rutas y paradas",
    detalle: "Trazados sobre las calles reales",
    icono: (
      <>
        <path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
  },
  {
    titulo: "Incidencias",
    detalle: "Reportes de la calle al momento",
    icono: <path d="M12 3l9 16H3zM12 10v4M12 17v.1" />,
  },
];

/**
 * Mitad visual del ingreso: la foto propia de los Morros y qué se hace en el
 * panel. Solo desde md: en un teléfono estorbaría al formulario, y sin `preload`
 * la foto ni se descarga allí.
 *
 * El velo oscuro va en las dos puntas de la foto, donde está el texto, y deja
 * el cielo y los morros del medio a la vista. Es el mismo en los dos temas.
 */
export function PortadaIngreso() {
  return (
    <section
      aria-label="EcoRuta San Juan"
      className="relative isolate hidden flex-[1.35] flex-col justify-between overflow-hidden p-10 text-white md:flex lg:p-12"
    >
      <Image
        src={morrosPanoramico}
        alt=""
        fill
        sizes="(min-width: 1024px) 60vw, 50vw"
        placeholder="blur"
        className="-z-10 object-cover object-[42%_50%]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(14_42_51/.6)_0%,rgb(14_42_51/0)_30%,rgb(14_42_51/0)_42%,rgb(14_42_51/.92)_100%)]"
      />

      <LogoAdmin subtitulo="Panel de gestión" />

      <div className="flex max-w-[720px] flex-col gap-4">
        <p className="text-balance text-[clamp(2rem,3.2vw,2.75rem)] leading-[1.1] font-extrabold tracking-tight">
          La flota de San Juan de los Morros, en vivo y en un solo lugar.
        </p>
        <p className="max-w-[540px] text-lg leading-relaxed text-white/90">
          Sigue las unidades en servicio, ordena rutas y paradas y responde a las
          incidencias que reportan los choferes.
        </p>

        <ul className="mt-4 grid grid-cols-3 gap-3.5">
          {FUNCIONES.map(({ titulo, detalle, icono }) => (
            <li
              key={titulo}
              className="flex flex-col gap-2 rounded-2xl border border-white/25 bg-white/10 px-4 py-3.5 backdrop-blur-sm"
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
                className="text-sol"
                aria-hidden="true"
              >
                {icono}
              </svg>
              <span className="text-[15px] font-bold">{titulo}</span>
              <span className="text-[13px] text-white/85">{detalle}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="flex items-center gap-2 text-[13px] text-white/85">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11z" />
        </svg>
        Los Morros, San Juan de los Morros · Guárico
      </p>
    </section>
  );
}
