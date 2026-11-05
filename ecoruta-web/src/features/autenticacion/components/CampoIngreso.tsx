import type { InputHTMLAttributes, ReactNode } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  etiqueta: string;
  icono: ReactNode;
  /** Control al final del campo, como «Mostrar» en la contraseña. */
  accion?: ReactNode;
};

/**
 * Campo del ingreso: ícono al inicio y una acción opcional al final, dentro del
 * mismo contorno. El foco se marca en el contorno completo (`focus-within`),
 * no solo en el texto, para que se vea dónde está el cursor.
 */
export function CampoIngreso({ etiqueta, icono, accion, id, ...props }: Props) {
  const idCampo = id ?? props.name;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={idCampo} className="text-sm font-semibold">
        {etiqueta}
      </label>
      <div className="flex h-[52px] items-center gap-2.5 rounded-xl border-[1.5px] border-borde-campo bg-superficie px-3.5 text-tinta-media transition-[border-color,box-shadow] duration-200 ease-out focus-within:border-marca focus-within:shadow-[0_0_0_4px_color-mix(in_oklab,var(--color-marca)_22%,transparent)]">
        <span aria-hidden="true" className="flex">
          {icono}
        </span>
        <input
          id={idCampo}
          className="h-full min-w-0 flex-1 bg-transparent text-base text-tinta outline-none placeholder:text-tinta-suave"
          {...props}
        />
        {accion}
      </div>
    </div>
  );
}
