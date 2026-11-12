import { Boton } from "@/components/ui/Boton";
import { IconoRuta } from "@/components/ui/IconoRuta";
import { colorDeRutaAdaptable, glifoSobreColorDeRutaAdaptable } from "@/domain/colores";
import type { Aviso } from "@/domain/avisos";
import {
  estimarCaminataMinutos,
  formatearDistancia,
  formatearHora,
} from "@/domain/formato";
import type { ParadaElegida, RutaEnParada } from "../types";

type Props = {
  aviso: Aviso;
  parada: ParadaElegida;
  unidadNombre: string | null;
  /** La ruta del viaje que generó el aviso: por una parada pueden pasar varias. */
  ruta: Pick<RutaEnParada, "nombre" | "color" | "icono"> | null;
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
 * Aparece arriba, bajo la cabecera: abajo está la hoja con la parada, y el
 * aviso no debe taparla. El z-index pasa el de la hoja y el de los controles
 * de Leaflet.
 */
export function AvisoDeParada(props: Props) {
  const { aviso, parada, ruta, alDescartar } = props;
  const viene = aviso.tipo === "acercandose";

  return (
    <div
      role="alert"
      className={`fixed inset-x-4 top-[calc(4.25rem+env(safe-area-inset-top))] z-[1200] mx-auto flex max-w-md flex-col gap-3 rounded-[20px] border-[1.5px] bg-superficie p-4 lg:right-auto lg:left-6 lg:mx-0 lg:w-[26rem] ${
        viene ? "border-exito" : "border-advertencia-borde"
      }`}
    >
      <div className="flex items-center gap-3.5">
        <span
          aria-hidden="true"
          className="flex size-12 shrink-0 items-center justify-center rounded-full"
          style={{
            backgroundColor: colorDeRutaAdaptable(ruta?.color ?? null),
            color: glifoSobreColorDeRutaAdaptable(ruta?.color ?? null),
          }}
        >
          <IconoRuta icono={ruta?.icono ?? null} tamano={24} />
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-[1.0625rem] font-bold leading-tight">
            {titulo(viene, ruta?.nombre ?? "Tu unidad")}
          </span>
          <span className="text-[0.8125rem] font-semibold text-tinta-media">
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

      <Boton variante="secundario" onClick={alDescartar} className="w-full">
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
