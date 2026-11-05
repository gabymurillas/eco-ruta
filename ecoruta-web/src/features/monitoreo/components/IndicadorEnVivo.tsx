"use client";

import { useMonitoreoEnVivo } from "../hooks/useMonitoreoEnVivo";

/**
 * Mantiene la pantalla al día y dice si lo está logrando. Si el canal se cae, el
 * gestor tiene que saber que lo que ve puede estar atrasado: la revisión
 * periódica sigue, pero ya no es al instante.
 *
 * El texto va en tinta; el verde queda en el punto, que además late.
 */
export function IndicadorEnVivo() {
  const { conectado } = useMonitoreoEnVivo();

  return (
    <p
      role="status"
      className="flex items-center gap-2 rounded-full border border-borde bg-superficie px-3 py-1.5 text-[13px] font-semibold"
    >
      <span
        aria-hidden="true"
        className={`size-2 rounded-full ${conectado ? "pulso-en-vivo bg-exito" : "bg-tinta-suave"}`}
      />
      {conectado ? "En vivo" : "Conectando…"}
    </p>
  );
}
