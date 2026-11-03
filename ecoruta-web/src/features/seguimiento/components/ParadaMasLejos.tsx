import { Boton } from "@/components/ui/Boton";
import { formatearDistancia } from "@/domain/formato";
import type { ParadaConRutas } from "../types";
import { ListaRutasEnParada } from "./ListaRutasEnParada";

type Props = {
  parada: ParadaConRutas;
  alElegir: (parada: ParadaConRutas) => void;
};

/**
 * La parada más cercana cuando ninguna queda a distancia de caminar. No se
 * estima la caminata: a varios kilómetros nadie va a pie, y el número
 * engañaría más de lo que ayuda.
 */
export function ParadaMasLejos({ parada, alElegir }: Props) {
  return (
    <section className="flex flex-col gap-3 rounded-[18px] border-[0.5px] border-borde bg-fondo p-4">
      <p className="text-sm leading-relaxed text-tinta-media">
        La más cercana es{" "}
        <strong className="font-serif font-bold text-tinta">
          {parada.nombre}
        </strong>
        , a {formatearDistancia(parada.distanciaM)} de ti.
      </p>

      <ListaRutasEnParada rutas={parada.rutas} />

      <Boton
        variante="secundario"
        onClick={() => alElegir(parada)}
        className="self-start"
      >
        Seguir esta parada
      </Boton>
    </section>
  );
}
