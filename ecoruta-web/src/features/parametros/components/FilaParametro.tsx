import type { ReactNode } from "react";
import type { DefinicionParametro } from "@/domain/parametros";

type Props = {
  definicion: DefinicionParametro;
  texto: string;
  /** El valor guardado: con él se dice «antes 45 s». Null si falta en la tabla. */
  guardado: number | null;
  cambiado: boolean;
  error?: string;
  onCambio: (texto: string) => void;
  /** Una nota propia del parámetro, debajo de la explicación. */
  nota?: ReactNode;
};

export function FilaParametro({ definicion, texto, guardado, cambiado, error, onCambio, nota }: Props) {
  const { clave, titulo, unidad, minimo, maximo, explicacion } = definicion;
  const antes = guardado === null ? "sin valor guardado" : `antes ${guardado} ${unidad}`;
  const idRango = `${clave}-rango`;
  const idEstado = `${clave}-estado`;
  const fondo = error ? "bg-error/8" : cambiado ? "bg-marca-tenue" : "";
  const borde = error ? "border-2 border-error" : cambiado ? "border-[1.5px] border-marca" : "border-[1.5px] border-borde-campo";

  return (
    <div className={`flex gap-4 border-b border-borde-suave px-4.5 py-3 transition-colors duration-200 last:border-b-0 ${fondo}`}>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <label htmlFor={clave} className="text-[14.5px] font-bold">
          {titulo}
        </label>
        <p className="text-[12.5px] leading-snug text-tinta-media">{explicacion}</p>
        {nota}
        <Estado id={idEstado} error={error} cambiado={cambiado} antes={antes} />
      </div>

      <div className="flex w-[150px] shrink-0 flex-col gap-1">
        <div
          className={`flex h-[42px] items-center rounded-[10px] bg-superficie pr-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-marca-profundo ${borde}`}
        >
          <input
            id={clave}
            // Solo viaja lo cambiado: no se pisa lo que otro admin guardó entretanto.
            name={cambiado ? clave : undefined}
            type="number"
            inputMode="numeric"
            value={texto}
            min={minimo}
            max={maximo}
            onChange={(evento) => onCambio(evento.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={`${idRango} ${idEstado}`}
            className="h-full min-w-0 flex-1 bg-transparent px-3 text-[16px] font-bold text-tinta outline-none"
          />
          <span aria-hidden="true" className="text-sm font-semibold text-tinta-media">
            {unidad}
          </span>
        </div>
        <small id={idRango} className="text-xs text-tinta-media">
          entre {minimo} y {maximo} {unidad}
        </small>
      </div>
    </div>
  );
}

/** El color nunca va solo: el estado se dice con ícono y texto. */
function Estado({ id, error, cambiado, antes }: { id: string; error?: string; cambiado: boolean; antes: string }) {
  if (!error && !cambiado) {
    return <span id={id} />;
  }

  return (
    <span
      id={id}
      role={error ? "alert" : undefined}
      className={`mt-1 inline-flex w-fit items-center gap-1.5 rounded-full border bg-superficie px-2.5 py-0.5 text-xs font-bold ${
        error ? "border-error text-error" : "border-borde text-tinta"
      }`}
    >
      {error ? (
        <svg width="11" height="11" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2L23 21H1z" fill="currentColor" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" className="text-marca" aria-hidden="true">
          <path d="M4 20h4L19 9l-4-4L4 16z" />
        </svg>
      )}
      {error ?? `Cambiado · ${antes}`}
    </span>
  );
}
