import { BOTON_FILA, BOTON_FILA_ICONO } from "@/components/ui/estilos-panel";
import type { Letrero } from "@/services/letreros.service";

export type AccionDeFila = "unidades" | "editar" | "eliminar";

type Props = {
  letreros: readonly Letrero[];
  elegidoId: string | null;
  /** El letrero que se está activando o desactivando: su botón espera. */
  cambiandoId: string | null;
  /** Null para quien solo puede mirar: la columna de acciones no se dibuja. */
  onAccion: ((letreroId: string, accion: AccionDeFila) => void) | null;
  onAlternarActivo: (letrero: Letrero) => void;
};

export function idBotonDeFila(letreroId: string, accion: AccionDeFila): string {
  return `${accion}-letrero-${letreroId}`;
}

export function TablaLetreros({ letreros, elegidoId, cambiandoId, onAccion, onAlternarActivo }: Props) {
  return (
    <table className="w-full border-collapse text-sm">
      <caption className="sr-only">Letreros del catálogo, su estado y cuántas unidades los usan</caption>
      <thead className="sticky top-0 z-10 bg-fondo">
        <tr className="text-left text-[12.5px] font-bold text-tinta-media">
          <th scope="col" className="border-b border-borde px-4 py-2.5">Letrero</th>
          <th scope="col" className="border-b border-borde px-4 py-2.5">Orden</th>
          <th scope="col" className="border-b border-borde px-4 py-2.5">Estado</th>
          <th scope="col" className="border-b border-borde px-4 py-2.5">Unidades</th>
          {onAccion && <th scope="col" className="border-b border-borde px-4 py-2.5 text-right">Acciones</th>}
        </tr>
      </thead>
      <tbody>
        {letreros.map((letrero) => (
          <tr
            key={letrero.id}
            className={`border-b border-borde-suave ${letrero.id === elegidoId ? "bg-marca-tenue" : "hover:bg-fondo"}`}
          >
            <th scope="row" className="px-4 py-3 text-left font-bold">{letrero.nombre}</th>
            <td className="px-4 py-3 tabular-nums">{letrero.orden}</td>
            <td className="px-4 py-3"><ChipEstado activo={letrero.activo} /></td>
            <td className="px-4 py-3 tabular-nums">{describirUnidades(letrero.unidadIds.length)}</td>
            {onAccion && (
              <td className="px-4 py-3">
                <AccionesDeFila
                  letrero={letrero}
                  cambiando={letrero.id === cambiandoId}
                  onAccion={(accion) => onAccion(letrero.id, accion)}
                  onAlternarActivo={() => onAlternarActivo(letrero)}
                />
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AccionesDeFila({
  letrero,
  cambiando,
  onAccion,
  onAlternarActivo,
}: {
  letrero: Letrero;
  cambiando: boolean;
  onAccion: (accion: AccionDeFila) => void;
  onAlternarActivo: () => void;
}) {
  return (
    <div className="flex justify-end gap-1.5 whitespace-nowrap">
      <button
        id={idBotonDeFila(letrero.id, "unidades")}
        type="button"
        onClick={() => onAccion("unidades")}
        aria-label={`Elegir las unidades que pueden usar ${letrero.nombre}`}
        className={BOTON_FILA}
      >
        Unidades
      </button>
      <button type="button" onClick={onAlternarActivo} disabled={cambiando} className={BOTON_FILA}>
        {cambiando ? "Guardando…" : letrero.activo ? "Desactivar" : "Activar"}
        <span className="sr-only"> {letrero.nombre}</span>
      </button>
      <button
        id={idBotonDeFila(letrero.id, "editar")}
        type="button"
        onClick={() => onAccion("editar")}
        aria-label={`Editar ${letrero.nombre}`}
        title="Editar"
        className={BOTON_FILA_ICONO}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 20h4L19 9l-4-4L4 16z" />
          <path d="M13.5 6.5l4 4" />
        </svg>
      </button>
      <button
        id={idBotonDeFila(letrero.id, "eliminar")}
        type="button"
        onClick={() => onAccion("eliminar")}
        aria-label={`Eliminar ${letrero.nombre}`}
        title="Eliminar"
        className={`${BOTON_FILA_ICONO} text-error`}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
        </svg>
      </button>
    </div>
  );
}

/** Sobrio, como el chip del teléfono en Unidades: el texto dice el estado, el punto acompaña. */
function ChipEstado({ activo }: { activo: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-borde bg-fondo px-2.5 py-0.5 text-xs font-bold whitespace-nowrap">
      <span aria-hidden="true" className={`size-2 rounded-full ${activo ? "bg-exito" : "bg-tinta-suave"}`} />
      {activo ? "Activo" : "Inactivo"}
    </span>
  );
}

function describirUnidades(cantidad: number): string {
  if (cantidad === 0) {
    return "Ninguna";
  }

  return cantidad === 1 ? "1 unidad" : `${cantidad} unidades`;
}
