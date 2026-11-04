"use client";

import { useMonitoreoEnVivo } from "../hooks/useMonitoreoEnVivo";

/**
 * Mantiene la pantalla al día y dice si lo está logrando. Si el canal se cae, el
 * gestor tiene que saber que lo que ve puede estar atrasado: la revisión
 * periódica sigue, pero ya no es al instante.
 */
export function IndicadorEnVivo() {
  const { conectado } = useMonitoreoEnVivo();

  return (
    <p
      role="status"
      className={`flex items-center gap-2 text-xs font-bold ${conectado ? "text-exito" : "text-tinta-media"}`}
    >
      <span
        aria-hidden="true"
        className={`size-2 rounded-full ${conectado ? "pulso-en-vivo bg-exito" : "bg-tinta-suave"}`}
      />
      {conectado ? "En vivo" : "Conectando…"}
    </p>
  );
}
