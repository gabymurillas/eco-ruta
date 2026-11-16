import Image from "next/image";
import morrosPanoramico from "@/assets/morros-panoramico.jpg";
import { EnlaceVerMiParada } from "./EnlaceVerMiParada";

/**
 * Primera vista de la portada. La foto va al lado del texto en escritorio y
 * encima de él en el teléfono, nunca detrás (docs/03-diseno → fotografía de
 * identidad). Es decorativa: el texto ya dice dónde estamos, así que `alt=""`.
 * `preload` porque es lo primero que se ve en cualquier pantalla.
 */
export function HeroPortada() {
  return (
    <section
      aria-labelledby="titulo-portada"
      className="grid items-center gap-6 md:grid-cols-[1.15fr_1fr] md:gap-10"
    >
      <div className="relative aspect-[21/9] overflow-hidden rounded-2xl border border-borde md:order-2 md:aspect-[4/3]">
        <Image
          src={morrosPanoramico}
          alt=""
          fill
          preload
          sizes="(min-width: 1152px) 520px, (min-width: 768px) 45vw, 100vw"
          placeholder="blur"
          className="object-cover object-[42%_50%]"
        />
      </div>

      <div className="flex flex-col items-start gap-5 md:order-1">
        <h1
          id="titulo-portada"
          className="text-balance text-[2rem] leading-[1.1] font-extrabold tracking-tight md:text-[2.75rem]"
        >
          EcoRuta San Juan
        </h1>
        <p className="max-w-[34rem] text-[1.0625rem] leading-relaxed text-tinta-media">
          Mira dónde viene tu unidad de transporte o el camión del aseo y cuánto
          le falta para llegar a tu parada. Sin instalar nada y sin crear cuenta.
        </p>
        <EnlaceVerMiParada />
        <p className="text-[0.8125rem] text-tinta-media">
          Hecho para San Juan de los Morros, Guárico.
        </p>
      </div>
    </section>
  );
}
