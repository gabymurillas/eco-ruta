import { BOTON_FILA, BOTON_FILA_ICONO } from "@/components/ui/estilos-panel";
import { inicialesDeCorreo } from "@/domain/equipo";
import { NOMBRE_DE_ROL } from "@/domain/roles";
import type { MiembroDelEquipo } from "@/services/equipo.service";

/** El miembro con los textos de fecha ya calculados en el servidor. */
export type FichaMiembro = MiembroDelEquipo & {
  ultimoIngreso: string;
  /** «hoy», «ayer»…: cuándo se mandó la invitación, si sigue pendiente. */
  invitadoHace: string | null;
};

export type AccionDeMiembro = "rol" | "quitar";

type Props = {
  miembro: FichaMiembro;
  esTuCuenta: boolean;
  elegida: boolean;
  reenviando: boolean;
  onAccion: (accion: AccionDeMiembro) => void;
  onReenviar: () => void;
};

export function idBotonDeMiembro(miembroId: string, accion: AccionDeMiembro): string {
  return `${accion}-miembro-${miembroId}`;
}

export function FilaMiembro({ miembro, esTuCuenta, elegida, reenviando, onAccion, onReenviar }: Props) {
  return (
    <tr className={`border-b border-borde-suave ${elegida ? "bg-marca-tenue" : "hover:bg-fondo"}`}>
      {/* w-full + max-w-0: la columna toma lo que sobra y un correo largo se corta, sin empujar las acciones. */}
      <td className="w-full max-w-0 px-4 py-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-marca-tenue text-[13px] font-bold"
          >
            {inicialesDeCorreo(miembro.correo)}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-bold" title={miembro.correo}>{miembro.correo}</span>
            {esTuCuenta && <span className="text-[12.5px] text-tinta-media">Tu cuenta</span>}
          </span>
        </div>
      </td>

      <td className="px-4 py-3 font-semibold whitespace-nowrap">{NOMBRE_DE_ROL[miembro.rol]}</td>

      <td className="px-4 py-3">
        {miembro.invitacionPendiente ? (
          <>
            <ChipPendiente />
            <span className="mt-1 block text-xs text-tinta-media">
              Enviada {miembro.invitadoHace ?? "hace poco"}
            </span>
          </>
        ) : (
          <span className="whitespace-nowrap text-tinta-media">{miembro.ultimoIngreso}</span>
        )}
      </td>

      <td className="px-4 py-3">
        {/* Nadie se baja el rol ni se quita el acceso a sí mismo: su fila no ofrece nada. */}
        {!esTuCuenta && (
          <div className="flex justify-end gap-1.5 whitespace-nowrap">
            {miembro.invitacionPendiente && (
              <button type="button" onClick={onReenviar} disabled={reenviando} className={BOTON_FILA}>
                {reenviando ? "Reenviando…" : "Reenviar"}
              </button>
            )}
            <button
              id={idBotonDeMiembro(miembro.id, "rol")}
              type="button"
              onClick={() => onAccion("rol")}
              className={BOTON_FILA}
            >
              Cambiar rol
              <span className="sr-only"> de {miembro.correo}</span>
            </button>
            <button
              id={idBotonDeMiembro(miembro.id, "quitar")}
              type="button"
              onClick={() => onAccion("quitar")}
              aria-label={`${miembro.invitacionPendiente ? "Cancelar la invitación" : "Quitar el acceso"} de ${miembro.correo}`}
              title={miembro.invitacionPendiente ? "Cancelar invitación" : "Quitar acceso"}
              className={`${BOTON_FILA_ICONO} text-error`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="9" cy="8" r="3.5" />
                <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16.5 9.5l5 5M21.5 9.5l-5 5" />
              </svg>
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

/** Sobrio, como el resto del panel: fondo neutro, el color solo en el ícono. */
function ChipPendiente() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-borde bg-fondo px-2.5 py-0.5 text-xs font-bold whitespace-nowrap">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" className="text-marca" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
      Invitación pendiente
    </span>
  );
}
