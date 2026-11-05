import { redirect } from "next/navigation";
import { salir } from "@/features/autenticacion/acciones";
import { MenuAdmin } from "@/features/autenticacion/components/MenuAdmin";
import { obtenerAdministrador } from "@/services/auth.service";

/**
 * Marco y guard de todo el panel.
 *
 * Vive en el grupo (panel) y no en /admin, porque en App Router los layouts anidan:
 * si estuviera en /admin tambien envolveria a /admin/ingreso y su redireccion crearia
 * un bucle infinito. El grupo no aparece en la URL, asi que (panel)/page.tsx es /admin.
 *
 * El proxy ya redirige a quien no tenga sesion; esto verifica ademas que la cuenta
 * tenga rol de administracion, y es la ultima barrera antes de RLS.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const administrador = await obtenerAdministrador();

  if (!administrador) {
    redirect("/admin/ingreso");
  }

  const iniciales = administrador.correo.slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-dvh">
      {/* Fija a la altura de la ventana: si se estirara con el contenido, en una página
          larga el botón de cerrar sesión quedaría abajo, fuera de la pantalla. */}
      <aside className="sticky top-0 flex h-dvh w-58 shrink-0 flex-col overflow-y-auto border-r-[0.5px] border-borde bg-superficie p-4 pt-6">
        <div className="px-2 pb-6">
          <p className="font-serif text-xl font-black tracking-tight">EcoRuta</p>
          <p className="text-xs font-semibold text-tinta-suave">Administración</p>
        </div>

        <MenuAdmin />

        <div className="flex-1" />

        <div className="flex items-center gap-3 border-t-[0.5px] border-borde pt-3.5">
          <span
            aria-hidden="true"
            className="flex size-9 items-center justify-center rounded-full border-[0.5px] border-borde bg-marca-tenue text-[13px] font-bold text-marca-profundo"
          >
            {iniciales}
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-[13px] font-bold">Administrador</span>
            <span className="truncate text-[11px] font-semibold text-tinta-suave">
              {administrador.correo}
            </span>
          </div>
          <form action={salir}>
            <button
              type="submit"
              aria-label="Cerrar sesión"
              className="flex size-9 items-center justify-center rounded-full text-tinta-suave transition-colors duration-300 ease-out hover:bg-marca-tenue hover:text-marca-profundo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M14 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8" />
                <path d="M16 15l4-3-4-3" />
                <path d="M20 12H10" />
              </svg>
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* El panel es de escritorio: el mapa, la tabla y el editor no caben en un
            teléfono. Se avisa en vez de bloquear, por si hay que mirar algo en la calle. */}
        <p
          role="note"
          className="border-b-[0.5px] border-advertencia-borde bg-advertencia-fondo px-4 py-2.5 text-xs font-semibold text-advertencia-tinta md:hidden"
        >
          El panel está pensado para una computadora. En esta pantalla algunas secciones
          se ven cortadas.
        </p>
        {children}
      </div>
    </div>
  );
}
