import { IconoRuta } from "@/components/ui/IconoRuta";
import { colorDeRuta, tintaSobreColorDeRuta } from "@/domain/colores";
import {
  describirAntiguedad,
  evaluarLlegada,
  puedeEstimarTiempo,
  type EstadoLlegada,
} from "@/domain/llegadas";
import type { LlegadaRow } from "@/services/llegadas.service";

type Props = {
  llegadas: readonly LlegadaRow[];
  umbralSinSenalS: number;
};

export function ListaLlegadas({ llegadas, umbralSinSenalS }: Props) {
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
        <FilaLlegada
          key={llegada.unidad_id}
          llegada={llegada}
          umbralSinSenalS={umbralSinSenalS}
        />
      ))}
    </ul>
  );
}

function FilaLlegada({
  llegada,
  umbralSinSenalS,
}: {
  llegada: LlegadaRow;
  umbralSinSenalS: number;
}) {
  const estado = evaluarLlegada({
    enViaje: llegada.viaje_id !== null,
    segundosSinSenal: llegada.segundos_sin_senal,
    umbralSinSenalS,
  });

  const senalPerdida = estado.tipo === "senal_perdida";
  const atenuado = estado.tipo !== "en_camino";

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

        <TiempoEstimado
          estado={estado}
          rutaTieneTrazado={llegada.ruta_tiene_trazado}
        />
      </div>

      {senalPerdida && <AvisoSenalPerdida estado={estado} />}
    </li>
  );
}

function TiempoEstimado({
  estado,
  rutaTieneTrazado,
}: {
  estado: EstadoLlegada;
  rutaTieneTrazado: boolean;
}) {
  if (estado.tipo === "sin_recorrido") {
    return (
      <span className="shrink-0 text-xs font-bold text-tinta-suave">
        Sin recorrido activo
      </span>
    );
  }

  if (estado.tipo === "senal_perdida") {
    return (
      <span className="shrink-0 text-xs font-bold text-advertencia-tinta">
        Sin confirmar
      </span>
    );
  }

  // Con trazado cargado aquí iría el tiempo estimado. Mientras no lo haya, se dice
  // que la unidad viene en camino en vez de inventar un número.
  if (!puedeEstimarTiempo(estado, rutaTieneTrazado)) {
    return (
      <span className="shrink-0 text-xs font-bold text-marca-profundo">En camino</span>
    );
  }

  return (
    <span className="shrink-0 font-serif text-[17px] font-black text-marca-profundo">
      En camino
    </span>
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
