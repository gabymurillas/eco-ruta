import { colorDeRuta, tintaSobreColorDeRuta } from "@/domain/colores";
import type { RutaEnParada } from "../types";
import { IconoRuta } from "@/components/ui/IconoRuta";

type Props = {
  rutas: readonly RutaEnParada[];
};

export function ListaRutasEnParada({ rutas }: Props) {
  if (rutas.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-tinta-media">
        Todavía no pasa ninguna ruta por esta parada.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-[10px]">
      {rutas.map((ruta) => (
        <li
          key={ruta.rutaId}
          className="flex h-[62px] items-center gap-3 rounded-2xl border-[0.5px] border-borde-suave bg-superficie px-4"
        >
          <span
            className="flex size-[34px] shrink-0 items-center justify-center rounded-full"
            style={{
              backgroundColor: colorDeRuta(ruta.color),
              color: tintaSobreColorDeRuta(ruta.color),
            }}
          >
            <IconoRuta icono={ruta.icono} />
          </span>

          <div className="flex flex-1 flex-col gap-[2px]">
            <span className="font-serif text-sm font-bold">{ruta.nombre}</span>
            <span className="text-xs font-semibold text-tinta-suave">
              {ruta.tipo ?? "Servicio sin tipo declarado"}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
