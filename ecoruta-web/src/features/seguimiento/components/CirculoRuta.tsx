import { IconoRuta } from "@/components/ui/IconoRuta";
import {
  colorDeRutaAdaptable,
  glifoSobreColorDeRutaAdaptable,
  necesitaContorno,
} from "@/domain/colores";

type Props = {
  color: string | null;
  icono: string | null;
  grande?: boolean;
  /** Sin señal, sin recorrido o ya pasó: la ruta se reconoce, pero no se espera. */
  apagado?: boolean;
};

/**
 * Ícono de la ruta sobre su color. Siempre acompaña al nombre: el color nunca
 * va solo. Sigue el modo oscuro del teléfono (ver `colorDeRutaAdaptable`).
 */
export function CirculoRuta({ color, icono, grande = false, apagado = false }: Props) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full ${
        grande ? "size-11" : "size-[34px]"
      } ${apagado ? "opacity-45" : ""}`}
      style={{
        backgroundColor: colorDeRutaAdaptable(color),
        color: glifoSobreColorDeRutaAdaptable(color),
        boxShadow: necesitaContorno(color)
          ? "inset 0 0 0 1.5px var(--contorno-mostaza)"
          : undefined,
      }}
    >
      <IconoRuta icono={icono} tamano={grande ? 22 : 18} />
    </span>
  );
}
