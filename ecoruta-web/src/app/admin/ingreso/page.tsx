import { cookies } from "next/headers";
import { leerTema, COOKIE_TEMA } from "@/domain/tema";
import { FormularioIngreso } from "@/features/autenticacion/components/FormularioIngreso";
import { MarcoIngreso } from "@/features/autenticacion/components/MarcoIngreso";

export const metadata = {
  title: "Ingreso · EcoRuta administración",
};

export default async function IngresoPage() {
  const tema = leerTema((await cookies()).get(COOKIE_TEMA)?.value);

  return (
    <MarcoIngreso
      tema={tema}
      titulo="Inicia sesión"
      bajada="Entra con la cuenta de administración del ente gestor."
    >
      <FormularioIngreso />

      <aside className="mt-7 flex gap-3 rounded-xl border border-borde bg-fondo px-4 py-3.5 text-[13.5px] leading-relaxed text-tinta-media">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="mt-0.5 shrink-0 text-marca"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 8v.1" />
        </svg>
        Solo el personal del ente gestor tiene cuenta. Los ciudadanos usan la web sin
        registrarse y cada unidad se vincula con un código.
      </aside>
    </MarcoIngreso>
  );
}
