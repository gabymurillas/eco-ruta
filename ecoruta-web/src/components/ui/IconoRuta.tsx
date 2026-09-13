import { formasDeIcono } from "@/domain/iconos";

type Props = {
  icono: string | null;
  tamano?: number;
};

/**
 * El ícono lo elige el admin al crear la ruta (rutas.icono). Como `rutas.tipo`
 * es texto libre, la interfaz no puede deducirlo: un valor desconocido o nulo
 * cae al marcador genérico en vez de romper la pantalla.
 *
 * Los trazos viven en `domain/iconos` porque el marcador del mapa dibuja los mismos.
 */
export function IconoRuta({ icono, tamano = 18 }: Props) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {formasDeIcono(icono).map((forma, indice) => {
        if (forma.tipo === "path") {
          return <path key={indice} d={forma.d} />;
        }

        if (forma.tipo === "rect") {
          return (
            <rect
              key={indice}
              x={forma.x}
              y={forma.y}
              width={forma.ancho}
              height={forma.alto}
              rx={forma.rx}
            />
          );
        }

        return <circle key={indice} cx={forma.cx} cy={forma.cy} r={forma.r} />;
      })}
    </svg>
  );
}
