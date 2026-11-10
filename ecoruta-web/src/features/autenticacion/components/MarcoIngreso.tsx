import type { ReactNode } from "react";
import { LogoAdmin } from "@/components/ui/LogoAdmin";
import type { Tema } from "@/domain/tema";
import { SelectorDeTema } from "@/features/tema/components/SelectorDeTema";
import { PortadaIngreso } from "./PortadaIngreso";

type Props = {
  tema: Tema;
  titulo: string;
  bajada: ReactNode;
  children: ReactNode;
};

/** El marco de las pantallas sin sesión: ingreso, pedir el enlace y elegir contraseña. */
export function MarcoIngreso({ tema, titulo, bajada, children }: Props) {
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

          <h1 className="text-[30px] font-extrabold tracking-tight">{titulo}</h1>
          <p className="mt-1.5 mb-8 text-tinta-media">{bajada}</p>

          {children}
        </div>
      </main>
    </div>
  );
}
