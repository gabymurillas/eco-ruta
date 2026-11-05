import type { InputHTMLAttributes, ReactNode } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  etiqueta: string;
  ayuda?: ReactNode;
  error?: string;
};

/**
 * Campo con etiqueta real asociada por `id`: un `<label>` que no apunta a su control
 * no sirve para lectores de pantalla ni amplía el área de clic.
 */
export function Campo({ etiqueta, ayuda, error, id, className = "", ...props }: Props) {
  const idCampo = id ?? props.name;
  const idAyuda = ayuda ? `${idCampo}-ayuda` : undefined;
  const idError = error ? `${idCampo}-error` : undefined;

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={idCampo}
        className="text-xs font-bold tracking-wide text-tinta-suave"
      >
        {etiqueta}
      </label>

      <input
        id={idCampo}
        aria-describedby={[idAyuda, idError].filter(Boolean).join(" ") || undefined}
        aria-invalid={error ? true : undefined}
        className={`h-12 rounded-[10px] border-[0.5px] bg-superficie px-3.5 text-[15px] font-semibold text-tinta transition-colors duration-300 ease-out placeholder:font-normal placeholder:text-tinta-suave focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-marca-profundo ${
          error ? "border-error" : "border-borde-campo"
        } ${className}`}
        {...props}
      />

      {ayuda && (
        <span id={idAyuda} className="text-xs leading-relaxed text-tinta-media">
          {ayuda}
        </span>
      )}

      {error && (
        <span id={idError} role="alert" className="text-xs font-semibold text-error">
          {error}
        </span>
      )}
    </div>
  );
}
