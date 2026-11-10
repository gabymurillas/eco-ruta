import { IconoRuta } from "@/components/ui/IconoRuta";
import { BOTON_FILA, BOTON_FILA_ICONO } from "@/components/ui/estilos-panel";
import { colorDeRuta, tintaSobreColorDeRuta } from "@/domain/colores";
import { bateriaEnAlerta, describirUltimaSenal } from "@/domain/flota";
import type { EstadoTelefono } from "@/domain/unidades";
import type { UnidadConRuta } from "@/services/unidades.service";

export type FichaUnidad = UnidadConRuta & {
  telefono: EstadoTelefono;
  segundosSinReporte: number | null;
};

export type AccionDeFila = "vincular" | "editar" | "eliminar";

type Props = {
  unidad: FichaUnidad;
  elegida: boolean;
  umbralBateriaPct: number;
  onAccion: (accion: AccionDeFila) => void;
};

const TEXTO_VINCULAR: Record<EstadoTelefono, string> = {
  vinculado: "Revincular",
  sin_reportar: "Revincular",
  codigo_pendiente: "Ver código",
  sin_vincular: "Vincular",
};

export function idBotonDeFila(unidadId: string, accion: AccionDeFila): string {
  return `${accion}-unidad-${unidadId}`;
}

export function FilaUnidad({ unidad, elegida, umbralBateriaPct, onAccion }: Props) {
  return (
    <tr className={`border-b border-borde-suave ${elegida ? "bg-marca-tenue" : "hover:bg-fondo"}`}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-full"
            style={{
              backgroundColor: colorDeRuta(unidad.rutaColor),
              color: tintaSobreColorDeRuta(unidad.rutaColor),
            }}
          >
            <IconoRuta icono={unidad.rutaIcono} tamano={17} />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-bold">{unidad.nombre}</span>
            <span className="truncate text-[12.5px] text-tinta-media">
              {unidad.rutaNombre ?? "Sin ruta asignada"}
            </span>
          </span>
        </div>
      </td>

      <td className="px-4 py-3">
        <ChipTelefono unidad={unidad} />
        <span className="mt-1 block text-xs text-tinta-media">
          Último reporte: {describirUltimaSenal(unidad.segundosSinReporte) ?? "nunca"}
        </span>
      </td>

      <td className="px-4 py-3">
        <Bateria pct={unidad.bateriaPct} alerta={bateriaEnAlerta(unidad.bateriaPct, umbralBateriaPct)} />
      </td>

      <td className="px-4 py-3">
        <div className="flex justify-end gap-1.5 whitespace-nowrap">
          <button
            id={idBotonDeFila(unidad.id, "vincular")}
            type="button"
            onClick={() => onAccion("vincular")}
            className={BOTON_FILA}
          >
            <IconoEnlace />
            {TEXTO_VINCULAR[unidad.telefono]}
          </button>
          <button
            id={idBotonDeFila(unidad.id, "editar")}
            type="button"
            onClick={() => onAccion("editar")}
            aria-label={`Editar ${unidad.nombre}`}
            title="Editar"
            className={BOTON_FILA_ICONO}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 20h4L19 9l-4-4L4 16z" />
              <path d="M13.5 6.5l4 4" />
            </svg>
          </button>
          <button
            id={idBotonDeFila(unidad.id, "eliminar")}
            type="button"
            onClick={() => onAccion("eliminar")}
            aria-label={`Eliminar ${unidad.nombre}`}
            title="Eliminar"
            className={`${BOTON_FILA_ICONO} text-error`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
}

/** Sobrio, como el resto del panel: fondo neutro, el color solo en el ícono. */
function ChipTelefono({ unidad }: { unidad: FichaUnidad }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-borde bg-fondo px-2.5 py-0.5 text-xs font-bold whitespace-nowrap">
      {unidad.telefono === "vinculado" && <span aria-hidden="true" className="size-2 rounded-full bg-exito" />}
      {unidad.telefono === "sin_vincular" && <span aria-hidden="true" className="size-2 rounded-full bg-tinta-suave" />}
      {unidad.telefono === "sin_reportar" && (
        <svg width="11" height="11" viewBox="0 0 24 24" className="text-advertencia" aria-hidden="true">
          <path d="M12 2L23 21H1z" fill="currentColor" />
        </svg>
      )}
      {unidad.telefono === "codigo_pendiente" && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" className="text-marca" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      )}
      {textoTelefono(unidad)}
    </span>
  );
}

function textoTelefono(unidad: FichaUnidad): string {
  switch (unidad.telefono) {
    case "vinculado":
      return "Vinculado";
    case "sin_reportar": {
      const desde = describirUltimaSenal(unidad.segundosSinReporte);
      return desde ? `Sin reportar ${desde.replace("hace ", "")}` : "Vinculado, nunca reportó";
    }
    case "codigo_pendiente":
      return "Código pendiente";
    case "sin_vincular":
      return "Sin vincular";
  }
}

function Bateria({ pct, alerta }: { pct: number | null; alerta: boolean }) {
  if (pct === null) {
    return <span className="text-tinta-suave">—</span>;
  }

  return (
    <span className="inline-flex items-center gap-2 font-semibold">
      <span aria-hidden="true" className="h-[7px] w-11 overflow-hidden rounded-full bg-borde">
        <span
          className={`block h-full ${alerta ? "bg-advertencia" : "bg-exito"}`}
          style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
        />
      </span>
      {pct} %{alerta && <span className="sr-only">, batería baja</span>}
    </span>
  );
}

function IconoEnlace() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </svg>
  );
}
