import Image from "next/image";

import morrosAtardecer from "@/assets/morros-atardecer.jpg";
import { FormularioIngreso } from "@/features/autenticacion/components/FormularioIngreso";

export const metadata = {
  title: "Ingreso · EcoRuta administración",
};

export default function IngresoPage() {
  return (
    <div className="flex min-h-dvh">
      <main className="flex w-full flex-col justify-center gap-9 px-8 py-16 sm:px-16 lg:w-[560px] lg:shrink-0 lg:border-r-[0.5px] lg:border-borde lg:bg-superficie lg:px-20">
        <header className="flex flex-col gap-1">
          <h1 className="font-serif text-3xl font-black tracking-tight">EcoRuta</h1>
          <p className="text-[13px] font-semibold tracking-wide text-tinta-suave">
            Administración · San Juan de los Morros
          </p>
        </header>

        <FormularioIngreso />

        <aside className="flex items-start gap-2.5 rounded-xl border-[0.5px] border-borde bg-superficie p-4 lg:bg-fondo">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mt-px shrink-0 text-tinta-suave"
            aria-hidden="true"
          >
            <rect x="4.5" y="10.5" width="15" height="9.5" rx="2.5" />
            <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
          </svg>
          <p className="text-xs leading-relaxed text-tinta-media">
            Solo el ente gestor inicia sesión. El ciudadano nunca se autentica y el
            dispositivo de cada unidad se vincula con un código, no con una cuenta.
          </p>
        </aside>
      </main>

      {/* Sin `preload`: en móvil el panel está oculto y la carga diferida evita descargar la foto. */}
      <figure className="relative hidden flex-1 bg-fondo lg:block">
        <Image
          src={morrosAtardecer}
          alt=""
          fill
          sizes="calc(100vw - 560px)"
          placeholder="blur"
          className="object-cover object-[50%_82%]"
        />
        <figcaption className="absolute bottom-6 left-6 rounded-full border-[0.5px] border-borde bg-superficie px-3.5 py-1.5 text-xs font-semibold text-tinta-media">
          Los Morros, San Juan de los Morros
        </figcaption>
      </figure>
    </div>
  );
}
