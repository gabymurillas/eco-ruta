import { LogoAdmin } from "@/components/ui/LogoAdmin";
import { NOMBRE_DE_ROL, type RolDelPanel } from "@/domain/roles";
import type { Tema } from "@/domain/tema";
import { BotonTema } from "@/features/tema/components/BotonTema";
import { salir } from "../acciones";
import { MenuAdmin } from "./MenuAdmin";

type Props = {
  correo: string;
  rol: RolDelPanel;
  tema: Tema;
};

/**
 * Barra lateral del panel: marca, secciones, tema y sesión.
 *
 * Es oscura en los dos temas: separa la navegación del área de trabajo sin
 * bordes ni sombras. Queda fija a la altura de la ventana para que cerrar
 * sesión nunca termine fuera de la pantalla en una página larga.
 */
export function BarraLateral({ correo, rol, tema }: Props) {
  const iniciales = correo.slice(0, 2).toUpperCase();

  return (
    <aside className="sticky top-0 flex h-dvh w-62 shrink-0 flex-col overflow-y-auto bg-menu px-4 pt-6 pb-4 text-white">
      <LogoAdmin subtitulo="Panel de gestión" className="px-1.5 pb-4" />

      <MenuAdmin rol={rol} />

      <div className="flex-1" />

      <BotonTema temaInicial={tema} />

      <div className="mt-2 flex items-center gap-3 border-t border-menu-activo px-1 pt-3.5">
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-[#197878] text-[13px] font-bold"
        >
          {iniciales}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-[13px] font-semibold">{NOMBRE_DE_ROL[rol]}</span>
          <span className="truncate text-xs text-menu-texto">{correo}</span>
        </div>
        <form action={salir}>
          <button
            type="submit"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="grid size-9 place-items-center rounded-full text-menu-texto transition-colors duration-200 ease-out hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sol"
          >
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
              <path d="M14 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8" />
              <path d="M16 15l4-3-4-3M20 12H10" />
            </svg>
          </button>
        </form>
      </div>
    </aside>
  );
}
