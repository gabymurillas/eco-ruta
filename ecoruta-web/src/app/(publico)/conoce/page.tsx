import type { Metadata } from "next";
import { CabeceraPortada } from "@/features/portada/components/CabeceraPortada";
import { ComoFunciona } from "@/features/portada/components/ComoFunciona";
import { HeroPortada } from "@/features/portada/components/HeroPortada";
import { LoQueConvieneSaber } from "@/features/portada/components/LoQueConvieneSaber";
import { PiePortada } from "@/features/portada/components/PiePortada";
import { ServiciosPortada } from "@/features/portada/components/ServiciosPortada";

export const metadata: Metadata = {
  title: "Conoce EcoRuta San Juan",
  description:
    "Mira dónde viene tu unidad de transporte o el camión del aseo y cuánto le falta a tu parada en San Juan de los Morros. Sin instalar nada y sin cuenta.",
};

/**
 * Portada para compartir en afiches, códigos QR y redes (CIU-15). La dirección
 * `/` sigue abriendo el mapa: quien ya usa EcoRuta no pasa por aquí. Es
 * estática y, a diferencia del mapa, tiene scroll normal.
 */
export default function PortadaPage() {
  return (
    <div className="tema-ciudadano flex min-h-dvh flex-col bg-fondo text-tinta">
      <CabeceraPortada />
      <main className="mx-auto flex w-full max-w-[1152px] flex-1 flex-col gap-14 px-4 py-8 md:gap-20 md:px-6 md:py-14">
        <HeroPortada />
        <ComoFunciona />
        <ServiciosPortada />
        <LoQueConvieneSaber />
      </main>
      <PiePortada />
    </div>
  );
}
