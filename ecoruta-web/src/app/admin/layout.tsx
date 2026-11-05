import { Figtree } from "next/font/google";
import { cookies } from "next/headers";
import { COOKIE_TEMA, leerTema } from "@/domain/tema";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

/**
 * Contenedor visual de todo /admin, ingreso incluido: fuente, paleta y tema.
 *
 * No verifica la sesión: esa guarda vive en (panel)/layout.tsx, porque aquí
 * también envolvería a /admin/ingreso y su redirección haría un bucle.
 *
 * El tema sale de una cookie leída en el servidor, así el HTML ya llega con
 * los colores correctos y no parpadea al cargar.
 */
export default async function AdminRaizLayout({ children }: LayoutProps<"/admin">) {
  const tema = leerTema((await cookies()).get(COOKIE_TEMA)?.value);

  return (
    <div
      data-tema={tema}
      className={`${figtree.variable} tema-admin flex min-h-dvh flex-1 flex-col`}
    >
      {children}
    </div>
  );
}
