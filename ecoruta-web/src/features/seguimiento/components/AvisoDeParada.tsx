import { Boton } from "@/components/ui/Boton";
import { IconoRuta } from "@/components/ui/IconoRuta";
import { colorDeRuta, tintaSobreColorDeRuta } from "@/domain/colores";
import type { Aviso } from "@/domain/avisos";
import {
  estimarCaminataMinutos,
  formatearDistancia,
  formatearHora,
} from "@/domain/formato";
import type { ParadaElegida } from "../types";

type Props = {
  aviso: Aviso;
  parada: ParadaElegida;
  unidadNombre: string | null;
  radioAproximacionM: number;
  alDescartar: () => void;
};

/**
 * Tarjeta flotante sobre el mapa (maqueta `diseno/usuario/AlertaProximidad`).
 *
 * El borde lleva el estado: verde si viene —es la buena noticia, hay tiempo—,
 * ámbar si ya pasó. El color de la ruta solo va en el círculo, junto a su
 * nombre, para que el ciudadano la relacione con su chip. Nunca terracota: es
 * un estado, no identidad.
 *
 * El z-index pasa el 1000 de los controles de Leaflet: el aviso va por encima
 * del mapa, no debajo.
 */
export function AvisoDeParada(props: Props) {
  const { aviso, parada, alDescartar } = props;
  const viene = aviso.tipo === "acercandose";
  // Una parada pertenece a una sola ruta (paradas.ruta_id).
  const ruta = parada.rutas[0] ?? null;

  return (
    <div
      role="alert"
      className={`fixed inset-x-4 bottom-6 z-[1100] mx-auto flex max-w-md flex-col gap-4 rounded-3xl border bg-superficie p-5 ${
        viene ? "border-exito" : "border-advertencia-borde"
      }`}
    >
      <div className="flex items-center gap-3.5">
        <span
          aria-hidden="true"
          className="flex size-14 shrink-0 items-center justify-center rounded-full"
          style={{
            backgroundColor: colorDeRuta(ruta?.color ?? null),
            color: tintaSobreColorDeRuta(ruta?.color ?? null),
          }}
        >
          <IconoRuta icono={ruta?.icono ?? null} tamano={27} />
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="font-serif text-[17px] font-bold leading-tight">
            {titulo(viene, ruta?.nombre ?? "Tu unidad")}
          </span>
          <span className="text-[13px] font-semibold text-tinta-media">
            {detalle(props)}
          </span>
        </div>
      </div>

      {viene && parada.distanciaM !== null && (
        <p className="text-sm leading-relaxed text-tinta-media">
          Te toma {estimarCaminataMinutos(parada.distanciaM)} min caminar hasta
          la parada.
        </p>
      )}

      <Boton onClick={alDescartar} className="w-full">
        Entendido
      </Boton>
    </div>
  );
}

function titulo(viene: boolean, rutaNombre: string): string {
  return viene
    ? `${rutaNombre} se acerca a tu parada`
    : `${rutaNombre} ya pasó por tu parada`;
}

function detalle({ aviso, parada, unidadNombre, radioAproximacionM }: Props) {
  const unidad = unidadNombre ? `${unidadNombre} · ` : "";

  return aviso.tipo === "acercandose"
    ? `${unidad}a menos de ${formatearDistancia(radioAproximacionM)} de ${parada.nombre}`
    : `${unidad}${parada.nombre} · a las ${formatearHora(aviso.creadoAt)}`;
}
