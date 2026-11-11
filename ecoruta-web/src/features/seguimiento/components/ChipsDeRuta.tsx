import { colorDeRutaAdaptable, necesitaContorno } from "@/domain/colores";
import type { RutaEnParada } from "../types";

type Props = {
  rutas: readonly RutaEnParada[];
};

/** Punto del color de la ruta más su nombre: nunca el punto solo. */
export function ChipsDeRuta({ rutas }: Props) {
  return (
    <ul className="flex flex-wrap gap-2">
      {rutas.map((ruta) => (
        <li
          key={ruta.rutaId}
          className="flex h-9 items-center gap-2 rounded-full border border-borde px-3.5 text-sm font-semibold"
        >
          <span
            aria-hidden="true"
            className="size-2.5 shrink-0 rounded-full"
            style={{
              backgroundColor: colorDeRutaAdaptable(ruta.color),
              boxShadow: necesitaContorno(ruta.color)
                ? "0 0 0 1.5px var(--contorno-mostaza)"
                : undefined,
            }}
          />
          {ruta.nombre}
        </li>
      ))}
    </ul>
  );
}
