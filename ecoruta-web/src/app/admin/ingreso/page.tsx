import { cookies } from "next/headers";
import { LogoAdmin } from "@/components/ui/LogoAdmin";
import { COOKIE_TEMA, leerTema } from "@/domain/tema";
import { FormularioIngreso } from "@/features/autenticacion/components/FormularioIngreso";
import { PortadaIngreso } from "@/features/autenticacion/components/PortadaIngreso";
import { SelectorDeTema } from "@/features/tema/components/SelectorDeTema";

export const metadata = {
  title: "Ingreso · EcoRuta administración",
};

export default async function IngresoPage() {
  const tema = leerTema((await cookies()).get(COOKIE_TEMA)?.value);

  return (
    <div className="flex min-h-dvh flex-1">
      <PortadaIngreso />

      <main className="relative flex w-full flex-col justify-center bg-superficie px-8 py-20 sm:px-16 md:w-[480px] md:shrink-0 md:border-l md:border-borde lg:w-[560px] lg:px-[72px]">
        <div className="absolute top-6 right-6">
          <SelectorDeTema temaInicial={tema} />
        </div>

        <div className="mx-auto flex w-full max-w-[416px] flex-col">
          {/* En el teléfono no hay foto: la marca va arriba del formulario. */}
          <LogoAdmin subtitulo="Panel de gestión" className="mb-10 md:hidden" />

          <h1 className="text-[30px] font-extrabold tracking-tight">Inicia sesión</h1>
          <p className="mt-1.5 mb-8 text-tinta-media">
            Entra con la cuenta de administración del ente gestor.
          </p>

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
        </div>
      </main>
    </div>
  );
}
