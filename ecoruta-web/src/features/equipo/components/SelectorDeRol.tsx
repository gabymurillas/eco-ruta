import { ALCANCE_DE_ROL, NOMBRE_DE_ROL, ROLES_DEL_PANEL, type RolDelPanel } from "@/domain/roles";

type Props = {
  /** Nombre del campo en el formulario. */
  name: string;
  elegido: RolDelPanel;
  onCambio?: (rol: RolDelPanel) => void;
};

/**
 * Los dos roles como opciones con su alcance escrito: quien reparte accesos
 * tiene que ver qué concede sin ir a la documentación.
 */
export function SelectorDeRol({ name, elegido, onCambio }: Props) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-xs font-bold tracking-wide text-tinta-suave">Rol</legend>
      {ROLES_DEL_PANEL.map((rol) => (
        <label
          key={rol}
          className="flex cursor-pointer items-start gap-3 rounded-[10px] border-[1.5px] border-borde-campo bg-superficie p-3 transition-colors duration-200 ease-out hover:bg-fondo has-checked:border-marca-profundo has-checked:bg-marca-tenue has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-marca-profundo"
        >
          <input
            type="radio"
            name={name}
            value={rol}
            defaultChecked={onCambio ? undefined : rol === elegido}
            checked={onCambio ? rol === elegido : undefined}
            onChange={onCambio ? () => onCambio(rol) : undefined}
            className="mt-0.5 size-4 shrink-0 accent-marca-profundo"
          />
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-bold">{NOMBRE_DE_ROL[rol]}</span>
            <span className="text-[12.5px] leading-relaxed text-tinta-media">{ALCANCE_DE_ROL[rol]}</span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
