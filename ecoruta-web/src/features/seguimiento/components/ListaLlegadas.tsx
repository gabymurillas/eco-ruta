import { IconoRuta } from "@/components/ui/IconoRuta";
import { colorDeRuta, tintaSobreColorDeRuta } from "@/domain/colores";
import { formatearMinutos } from "@/domain/formato";
import {
  describirAntiguedad,
  estimarLlegada,
  evaluarLlegada,
  type EstadoLlegada,
  type TiempoLlegada,
} from "@/domain/llegadas";
import type { LlegadaRow } from "@/services/llegadas.service";

type Props = {
  llegadas: readonly LlegadaRow[];
  umbralSinSenalS: number;
  penalizacionIncidenciaPct: number;
};

type PropsFila = Omit<Props, "llegadas"> & { llegada: LlegadaRow };

export function ListaLlegadas({ llegadas, ...ajustes }: Props) {
  if (llegadas.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-tinta-media">
        No hay unidades circulando por esta parada en este momento.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {llegadas.map((llegada) => (
        <FilaLlegada key={llegada.unidad_id} llegada={llegada} {...ajustes} />
      ))}
    </ul>
  );
}

function FilaLlegada({ llegada, umbralSinSenalS, penalizacionIncidenciaPct }: PropsFila) {
  const estado = evaluarLlegada({
    enViaje: llegada.viaje_id !== null,
    segundosSinSenal: llegada.segundos_sin_senal,
    umbralSinSenalS,
  });
  const tiempo = estimarLlegada({
    estado,
    rutaTieneTrazado: llegada.ruta_tiene_trazado,
    distanciaTrazadoM: llegada.distancia_trazado_m,
    yaPaso: llegada.ya_paso,
    velocidadesKmh: llegada.velocidades_kmh ?? [],
    incidenciaActiva: llegada.incidencia_activa,
    penalizacionIncidenciaPct,
  });

  const senalPerdida = estado.tipo === "senal_perdida";
  const atenuado = estado.tipo !== "en_camino" || tiempo.tipo === "ya_paso";

  return (
    <li
      className={`flex flex-col gap-2.5 rounded-2xl border-[0.5px] bg-superficie p-4 ${
        senalPerdida ? "border-advertencia-borde" : "border-borde-suave"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={`flex size-[34px] shrink-0 items-center justify-center rounded-full ${
            atenuado ? "opacity-45" : ""
          }`}
          style={{
            backgroundColor: colorDeRuta(llegada.ruta_color),
            color: tintaSobreColorDeRuta(llegada.ruta_color),
          }}
        >
          <IconoRuta icono={llegada.ruta_icono} />
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span
            className={`truncate font-serif text-sm font-bold ${atenuado ? "text-tinta-media" : ""}`}
          >
            {llegada.ruta_nombre}
          </span>
          <span className="text-xs font-semibold text-tinta-suave">
            {llegada.unidad_nombre}
            {llegada.ultima_parada && ` · pasó por ${llegada.ultima_parada}`}
          </span>
        </div>

        <TiempoEstimado estado={estado} tiempo={tiempo} />
      </div>

      {senalPerdida && <AvisoSenalPerdida estado={estado} />}
      {tiempo.tipo === "minutos" && tiempo.conIncidencia && <AvisoIncidencia />}
    </li>
  );
}

function TiempoEstimado({
  estado,
  tiempo,
}: {
  estado: EstadoLlegada;
  tiempo: TiempoLlegada;
}) {
  if (estado.tipo === "sin_recorrido") {
    return <EtiquetaEstado texto="Sin recorrido activo" />;
  }

  if (estado.tipo === "senal_perdida") {
    return (
      <span className="shrink-0 text-xs font-bold text-advertencia-tinta">
        Sin confirmar
      </span>
    );
  }

  if (tiempo.tipo === "ya_paso") {
    return <EtiquetaEstado texto="Ya pasó por aquí" />;
  }

  // Sin trazado no hay distancia confiable: se dice que viene en vez de inventar
  // un número.
  if (tiempo.tipo === "sin_estimado") {
    return <span className="shrink-0 text-xs font-bold text-tinta">En camino</span>;
  }

  return (
    <span className="flex shrink-0 flex-col items-end leading-none">
      <span className="font-serif text-[22px] font-black text-tinta">
        {tiempo.minutos === 0 ? "Llegando" : `~${formatearMinutos(tiempo.minutos)}`}
      </span>
      <span className="pt-1 text-[11px] font-semibold text-tinta-media">estimado</span>
    </span>
  );
}

function EtiquetaEstado({ texto }: { texto: string }) {
  return <span className="shrink-0 text-xs font-bold text-tinta-media">{texto}</span>;
}

function AvisoIncidencia() {
  return (
    <>
      <div className="h-px bg-borde-suave" />
      <p className="text-xs font-semibold text-advertencia-tinta">
        Hay una incidencia en esta ruta: el tiempo estimado ya suma un margen por ella.
      </p>
    </>
  );
}

function AvisoSenalPerdida({ estado }: { estado: EstadoLlegada }) {
  const antiguedad =
    estado.tipo === "senal_perdida" ? describirAntiguedad(estado.segundosSinSenal) : null;

  return (
    <>
      <div className="h-px bg-borde-suave" />
      <p className="flex items-center gap-2 text-xs font-semibold text-advertencia-tinta">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 1.8" />
        </svg>
        {antiguedad
          ? `Última posición ${antiguedad}. Puede seguir en camino, pero no podemos confirmarlo.`
          : "Inició el recorrido pero todavía no envía su posición."}
      </p>
    </>
  );
}
