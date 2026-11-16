"use client";

import Link from "next/link";
import { colorDeRutaAdaptable, necesitaContorno } from "@/domain/colores";
import { useSeguirRuta } from "../seguir-ruta";
import type { RutaEnParada } from "../types";
import { useHoja } from "./HojaInferior";

type Props = {
  rutas: readonly RutaEnParada[];
};

/**
 * Punto del color de la ruta más su nombre: nunca el punto solo. Tocar una
 * ruta la muestra en el mapa y sigue a su unidad más próxima; al lado, un
 * enlace a su recorrido completo (CIU-16).
 */
export function ChipsDeRuta({ rutas }: Props) {
  const { seguida, seguir } = useSeguirRuta();
  const { cambiarNivel } = useHoja();

  return (
    <ul className="flex flex-wrap gap-2">
      {rutas.map((ruta) => (
        <li key={ruta.rutaId} className="flex items-center gap-1">
          <button
            type="button"
            aria-pressed={seguida?.rutaId === ruta.rutaId}
            onClick={() => {
              seguir(ruta.rutaId);
              cambiarNivel("baja");
            }}
            className="flex min-h-12 items-center gap-2 rounded-full border border-borde px-3.5 text-sm font-semibold hover:bg-marca-tenue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo aria-pressed:border-tinta aria-pressed:bg-marca-tenue"
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
          </button>
          <Link
            href={`/ruta/${ruta.rutaId}`}
            aria-label={`Ver recorrido de ${ruta.nombre}`}
            className="flex min-h-12 items-center rounded-full px-3 text-sm font-bold text-marca-profundo hover:bg-marca-tenue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo"
          >
            Ver recorrido
          </Link>
        </li>
      ))}
    </ul>
  );
}
