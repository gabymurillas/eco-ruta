import { IconoRuta } from "@/components/ui/IconoRuta";
import { colorDeRuta, tintaSobreColorDeRuta } from "@/domain/colores";
import {
  bateriaEnAlerta,
  describirUltimaSenal,
  evaluarSalud,
  type SaludUnidad,
} from "@/domain/flota";
import type { EstadoUnidad } from "@/services/flota.service";

type Props = {
  unidad: EstadoUnidad;
  umbralSinSenalS: number;
  umbralBateriaPct: number;
  seleccionada?: boolean;
  /** Null si la unidad no tiene posición: no hay a dónde llevar el mapa. */
  alVerEnMapa?: (() => void) | null;
};

export function idDeTarjeta(unidadId: string): string {
  return `tarjeta-unidad-${unidadId}`;
}

const ESTADO: Record<SaludUnidad, { texto: string; alerta: boolean }> = {
  transmitiendo: { texto: "Transmitiendo", alerta: false },
  detenida: { texto: "Sin recorrido activo", alerta: false },
  sin_senal: { texto: "Sin señal", alerta: true },
  equipo_caido: { texto: "Equipo sin reportar", alerta: true },
  sin_vincular: { texto: "Sin dispositivo", alerta: false },
};

export function TarjetaUnidad({
  unidad,
  umbralSinSenalS,
  umbralBateriaPct,
  seleccionada = false,
  alVerEnMapa = null,
}: Props) {
  const salud = evaluarSalud({
    vinculado: unidad.dispositivo_vinculado,
    enRecorrido: unidad.en_recorrido,
    segundosSinSenal: unidad.segundos_sin_senal,
    segundosSinLatido: unidad.segundos_sin_latido,
    umbralSinSenalS,
  });
  const contenido = <ContenidoTarjeta unidad={unidad} salud={salud} umbralBateriaPct={umbralBateriaPct} />;
  const base = `relative grid w-full grid-cols-[40px_1fr_auto] items-center gap-3 rounded-xl p-2.5 text-left transition-colors duration-200 ease-out ${
    seleccionada ? "bg-fondo outline-2 -outline-offset-2 outline-marca-profundo" : ""
  }`;

  if (!alVerEnMapa) {
    return (
      <div id={idDeTarjeta(unidad.unidad_id)} className={base}>
        {contenido}
      </div>
    );
  }

  return (
    <button
      id={idDeTarjeta(unidad.unidad_id)}
      type="button"
      onClick={alVerEnMapa}
      aria-pressed={seleccionada}
      title="Ver en el mapa"
      className={`${base} scroll-my-16 hover:bg-fondo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo`}
    >
      {contenido}
    </button>
  );
}

function ContenidoTarjeta({
  unidad,
  salud,
  umbralBateriaPct,
}: {
  unidad: EstadoUnidad;
  salud: SaludUnidad;
  umbralBateriaPct: number;
}) {
  const estado = ESTADO[salud];
  const sinSenal = salud === "sin_senal" || salud === "equipo_caido";
  const ultimaSenal = describirUltimaSenal(unidad.segundos_sin_senal);

  return (
    <>
      <span
        aria-hidden="true"
        className={`grid size-10 place-items-center rounded-full ${sinSenal ? "border-2 border-dashed border-advertencia bg-superficie text-advertencia" : ""}`}
        style={
          sinSenal
            ? undefined
            : { backgroundColor: colorDeRuta(unidad.ruta_color), color: tintaSobreColorDeRuta(unidad.ruta_color) }
        }
      >
        <IconoRuta icono={unidad.ruta_icono} tamano={18} />
      </span>

      <span className="flex min-w-0 flex-col">
        <span className="truncate text-[14.5px] font-bold">{unidad.unidad_nombre}</span>
        <span className="truncate text-[13px] text-tinta-media">
          {unidad.ruta_nombre ?? "Sin ruta asignada"}
        </span>
        <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full border border-borde bg-fondo px-2 py-0.5 text-xs font-semibold">
          {estado.alerta ? (
            <svg width="11" height="11" viewBox="0 0 24 24" className="text-advertencia" aria-hidden="true">
              <path d="M12 2 23 21H1z" fill="currentColor" />
            </svg>
          ) : (
            <span
              aria-hidden="true"
              className={`size-2 rounded-full ${salud === "transmitiendo" ? "bg-exito" : "bg-tinta-suave"}`}
            />
          )}
          {estado.texto}
          {sinSenal && ultimaSenal && ` · ${ultimaSenal}`}
        </span>
      </span>

      <span className="flex flex-col items-end gap-0.5 text-right">
        <span className="text-[15px] font-bold">
          {salud === "transmitiendo" && unidad.velocidad_kmh !== null
            ? `${Math.round(unidad.velocidad_kmh)} km/h`
            : "—"}
        </span>
        <span className="text-xs text-tinta-suave">{ultimaSenal ?? "sin señal aún"}</span>
        <Bateria pct={unidad.bateria_pct} alerta={bateriaEnAlerta(unidad.bateria_pct, umbralBateriaPct)} />
      </span>
    </>
  );
}

function Bateria({ pct, alerta }: { pct: number | null; alerta: boolean }) {
  if (pct === null) {
    return null;
  }

  return (
    <span className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold">
      <span className="h-1.5 w-8 overflow-hidden rounded-full bg-borde" aria-hidden="true">
        <span
          className={`block h-full ${alerta ? "bg-advertencia" : "bg-exito"}`}
          style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
        />
      </span>
      {alerta && (
        <svg width="10" height="10" viewBox="0 0 24 24" className="text-advertencia" aria-hidden="true">
          <path d="M12 2 23 21H1z" fill="currentColor" />
        </svg>
      )}
      {pct} %{alerta && <span className="sr-only">, batería baja</span>}
    </span>
  );
}
