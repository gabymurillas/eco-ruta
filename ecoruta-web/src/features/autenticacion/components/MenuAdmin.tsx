"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type Seccion = {
  href: string;
  titulo: string;
  icono: ReactNode;
};

const TRAZO = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const SECCIONES: Seccion[] = [
  {
    href: "/admin",
    titulo: "Monitoreo",
    icono: (
      <svg width="18" height="18" viewBox="0 0 24 24" {...TRAZO}>
        <circle cx="12" cy="12" r="8.5" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    ),
  },
  {
    href: "/admin/rutas",
    titulo: "Rutas",
    icono: (
      <svg width="18" height="18" viewBox="0 0 24 24" {...TRAZO}>
        <path d="M4 17.5l5-2.5 6 3 5-2.5" />
        <path d="M4 11l5-2.5 6 3L20 9" />
      </svg>
    ),
  },
  {
    href: "/admin/paradas",
    titulo: "Paradas",
    icono: (
      <svg width="18" height="18" viewBox="0 0 24 24" {...TRAZO}>
        <path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    ),
  },
  {
    href: "/admin/unidades",
    titulo: "Unidades",
    icono: (
      <svg width="18" height="18" viewBox="0 0 24 24" {...TRAZO}>
        <rect x="4" y="4" width="16" height="12.5" rx="3.2" />
        <path d="M4 11.5h16" />
        <path d="M8 16.5v2.4M16 16.5v2.4" />
      </svg>
    ),
  },
  {
    href: "/admin/historicos",
    titulo: "Históricos",
    icono: (
      <svg width="18" height="18" viewBox="0 0 24 24" {...TRAZO}>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M8 19v-6M12.5 19v-9M17 19v-4" />
      </svg>
    ),
  },
  {
    href: "/admin/parametros",
    titulo: "Parámetros",
    icono: (
      <svg width="18" height="18" viewBox="0 0 24 24" {...TRAZO}>
        <path d="M7 6h13M7 12h13M7 18h13" />
        <circle cx="4" cy="6" r="1.3" />
        <circle cx="4" cy="12" r="1.3" />
        <circle cx="4" cy="18" r="1.3" />
      </svg>
    ),
  },
];

export function MenuAdmin() {
  const rutaActual = usePathname();

  return (
    <nav aria-label="Secciones de administración" className="flex flex-col gap-0.5">
      {SECCIONES.map((seccion) => {
        const activa =
          seccion.href === "/admin"
            ? rutaActual === "/admin"
            : rutaActual.startsWith(seccion.href);

        return (
          <Link
            key={seccion.href}
            href={seccion.href}
            aria-current={activa ? "page" : undefined}
            className={`flex h-11 items-center gap-3 rounded-[10px] px-3 text-sm transition-colors duration-300 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo ${
              activa
                ? "bg-marca-tenue font-bold text-marca-profundo"
                : "font-semibold text-tinta-media hover:bg-marca-tenue"
            }`}
          >
            {seccion.icono}
            {seccion.titulo}
          </Link>
        );
      })}
    </nav>
  );
}
