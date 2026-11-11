"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { puedeAdministrar, type RolDelPanel } from "@/domain/roles";

type Seccion = {
  href: string;
  titulo: string;
  icono: ReactNode;
  /** Solo la ve un administrador: el operador no tiene nada que hacer ahí. */
  soloAdmin?: boolean;
};

type Grupo = {
  titulo: string;
  secciones: Seccion[];
};

/**
 * Las secciones se agrupan por la tarea del gestor y no por orden alfabético:
 * lo que se mira todo el día (operación), lo que se configura de vez en cuando
 * (la red de servicio) y lo que se revisa o calibra (análisis y ajustes).
 */
const GRUPOS: Grupo[] = [
  {
    titulo: "Operación",
    secciones: [
      { href: "/admin", titulo: "Monitoreo", icono: <path d="M3 12h4l3-8 4 16 3-8h4" /> },
      {
        href: "/admin/incidencias",
        titulo: "Incidencias",
        icono: (
          <>
            <path d="M12 3l9 16H3z" />
            <path d="M12 10v4M12 17v.1" />
          </>
        ),
      },
    ],
  },
  {
    titulo: "Red de servicio",
    secciones: [
      {
        href: "/admin/rutas",
        titulo: "Rutas",
        icono: (
          <>
            <circle cx="6" cy="18" r="2.5" />
            <circle cx="18" cy="6" r="2.5" />
            <path d="M8.3 17C15 16 9 8 15.7 7" />
          </>
        ),
      },
      {
        href: "/admin/paradas",
        titulo: "Paradas",
        icono: (
          <>
            <path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11z" />
            <circle cx="12" cy="10" r="2.5" />
          </>
        ),
      },
      {
        href: "/admin/unidades",
        titulo: "Unidades",
        icono: (
          <>
            <rect x="4" y="4" width="16" height="13" rx="3" />
            <path d="M4 11h16M8 20v-3M16 20v-3" />
          </>
        ),
      },
    ],
  },
  {
    titulo: "Análisis y ajustes",
    secciones: [
      { href: "/admin/historicos", titulo: "Históricos", icono: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /> },
      {
        href: "/admin/parametros",
        titulo: "Parámetros",
        soloAdmin: true,
        icono: (
          <>
            <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
            <circle cx="16" cy="7" r="2" />
            <circle cx="10" cy="17" r="2" />
          </>
        ),
      },
      {
        href: "/admin/equipo",
        titulo: "Equipo",
        soloAdmin: true,
        icono: (
          <>
            <circle cx="9" cy="8" r="3.5" />
            <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8" />
          </>
        ),
      },
    ],
  },
];

export function MenuAdmin({ rol }: { rol: RolDelPanel }) {
  const rutaActual = usePathname();
  const visible = (seccion: Seccion) => !seccion.soloAdmin || puedeAdministrar(rol);

  return (
    <nav aria-label="Secciones de administración" className="flex flex-col">
      {GRUPOS.map((grupo) => (
        <div key={grupo.titulo} className="flex flex-col gap-0.5">
          <p className="px-2.5 pt-3.5 pb-1.5 text-xs font-semibold text-menu-grupo">{grupo.titulo}</p>
          {grupo.secciones.filter(visible).map((seccion) => (
            <EnlaceSeccion
              key={seccion.href}
              seccion={seccion}
              activa={
                seccion.href === "/admin"
                  ? rutaActual === "/admin"
                  : rutaActual.startsWith(seccion.href)
              }
            />
          ))}
        </div>
      ))}
    </nav>
  );
}

function EnlaceSeccion({ seccion, activa }: { seccion: Seccion; activa: boolean }) {
  return (
    <Link
      href={seccion.href}
      aria-current={activa ? "page" : undefined}
      className={`group flex h-11 items-center gap-3 rounded-[10px] px-2.5 text-[15px] font-semibold transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sol ${
        activa ? "bg-menu-activo text-white" : "text-menu-texto hover:bg-white/5 hover:text-white"
      }`}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={activa ? "text-sol" : ""}
        aria-hidden="true"
      >
        {seccion.icono}
      </svg>
      {seccion.titulo}
    </Link>
  );
}
