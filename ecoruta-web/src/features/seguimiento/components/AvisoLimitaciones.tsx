import { Boton } from "@/components/ui/Boton";

type Props = {
  alCerrar: () => void;
};

/**
 * Lo que la web no puede hacer, dicho una vez y con el porqué. Quien espera un
 * aviso que nunca llega porque cerró el navegador deja de confiar en el
 * sistema; quien sabe la regla, deja la página abierta.
 *
 * Nota en la terna ámbar de advertencia: es una limitación del servicio, no un
 * error. El texto va en tinta, que es lo que asegura el contraste.
 */
export function AvisoLimitaciones({ alCerrar }: Props) {
  return (
    <section
      aria-labelledby="titulo-limitaciones"
      className="flex flex-col gap-3 rounded-xl border border-advertencia-borde bg-advertencia-fondo p-4"
    >
      <h2 id="titulo-limitaciones" className="text-[0.9375rem] font-bold">
        Antes de empezar
      </h2>

      <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed text-tinta">
        <li>
          Los avisos llegan solo con esta página abierta. EcoRuta no usa
          cuentas, así que con el navegador cerrado no tiene cómo avisarte.
        </li>
        <li>
          Tu ubicación no se guarda. Sirve para buscar las paradas cercanas
          y, si tocas «Cómo llegar», para trazar el camino a pie.
        </li>
        <li>
          Los tiempos son estimados y dependen de la señal GPS de cada unidad.
          Si una pierde la señal, te lo indicamos.
        </li>
      </ul>

      <Boton variante="secundario" onClick={alCerrar} className="self-start">
        Entendido
      </Boton>
    </section>
  );
}
