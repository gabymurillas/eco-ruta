import { formatearMinutos } from "@/domain/formato";
import type { ProximaLlegada } from "@/domain/recorrido";

type Props = {
  proxima: ProximaLlegada | null;
};

const MINUTOS_POR_HORA = 60;

/**
 * Lo que viene a una parada del recorrido, con las palabras de «mi parada».
 * La cifra siempre lleva «estimado» al lado.
 */
export function EstadoDeParada({ proxima }: Props) {
  if (proxima === null) {
    return <Etiqueta texto="Sin unidades en camino" />;
  }

  const { estado, tiempo } = proxima;

  if (estado.tipo === "senal_perdida") {
    return <span className="shrink-0 text-xs font-bold text-advertencia-tinta">Sin confirmar</span>;
  }

  if (tiempo.tipo === "ya_paso") {
    return <Etiqueta texto="Ya pasó" />;
  }

  // Sin distancia confiable se dice que viene en vez de inventar un número.
  if (tiempo.tipo === "sin_estimado") {
    return <span className="shrink-0 text-xs font-bold">En camino</span>;
  }

  return (
    <span className="flex shrink-0 flex-col items-end leading-none">
      <span className="text-base font-extrabold tabular-nums tracking-tight">{cifra(tiempo.minutos)}</span>
      <span className="pt-1 text-xs font-bold text-tinta-suave">estimado</span>
    </span>
  );
}

function cifra(minutos: number): string {
  if (minutos === 0) {
    return "Llegando";
  }

  return minutos >= MINUTOS_POR_HORA ? `~${formatearMinutos(minutos)}` : `~${minutos} min`;
}

function Etiqueta({ texto }: { texto: string }) {
  return <span className="shrink-0 text-right text-xs font-bold text-tinta-media">{texto}</span>;
}
