import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { COOKIE_TEMA, leerTema } from "@/domain/tema";
import { BarraLateral } from "@/features/autenticacion/components/BarraLateral";
import { obtenerSesionDelPanel } from "@/services/auth.service";

/**
 * Marco y guard de todo el panel.
 *
 * Vive en el grupo (panel) y no en /admin, porque en App Router los layouts anidan:
 * si estuviera en /admin tambien envolveria a /admin/ingreso y su redireccion crearia
 * un bucle infinito. El grupo no aparece en la URL, asi que (panel)/page.tsx es /admin.
 * El layout de /admin existe, pero solo pone la fuente, la paleta y el tema.
 *
 * El proxy ya redirige a quien no tenga sesion; esto verifica ademas que la cuenta
 * tenga un rol del panel (admin u operador), y es la ultima barrera antes de RLS.
 * Lo que cada rol puede hacer lo deciden las paginas, las acciones y, al final, RLS.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const sesion = await obtenerSesionDelPanel();

  if (!sesion) {
    redirect("/admin/ingreso");
  }

  const tema = leerTema((await cookies()).get(COOKIE_TEMA)?.value);

  return (
    <div className="flex min-h-dvh">
      <BarraLateral correo={sesion.correo} rol={sesion.rol} tema={tema} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* El panel es de escritorio: el mapa, la tabla y el editor no caben en un
            teléfono. Se avisa en vez de bloquear, por si hay que mirar algo en la calle. */}
        <p
          role="note"
          className="border-b border-borde bg-superficie px-4 py-2.5 text-xs font-semibold md:hidden"
        >
          El panel está pensado para una computadora. En esta pantalla algunas secciones
          se ven cortadas.
        </p>
        {children}
      </div>
    </div>
  );
}
