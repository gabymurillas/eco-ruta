type Props = {
  penalizacionIncidenciaPct: number;
};

/**
 * En la terna ámbar de advertencia, con ícono y texto: el color no va solo. Si
 * la penalización está en 0 el tiempo estimado no suma nada, y decir que la
 * incluye sería falso.
 */
export function AvisoIncidencia({ penalizacionIncidenciaPct }: Props) {
  return (
    <p className="flex items-start gap-3 rounded-xl border border-advertencia-borde bg-advertencia-fondo p-4 text-sm leading-relaxed font-semibold text-tinta">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-px shrink-0 text-advertencia-tinta" aria-hidden="true">
        <path d="M12 3 2.5 20h19L12 3Z" />
        <path d="M12 10v4M12 17h.01" />
      </svg>
      <span>
        Hay una incidencia en esta ruta.
        {penalizacionIncidenciaPct > 0 && " El tiempo estimado incluye la demora."}
      </span>
    </p>
  );
}
