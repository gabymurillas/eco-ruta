import { Tarjeta } from "@/components/ui/Tarjeta";
import { colorDeRuta } from "@/domain/colores";
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

const TONO_POR_SALUD: Record<SaludUnidad, "neutro" | "advertencia" | "error"> = {
  transmitiendo: "neutro",
  detenida: "neutro",
  sin_senal: "error",
  equipo_caido: "error",
  sin_vincular: "neutro",
};

const LEYENDA_POR_SALUD: Record<SaludUnidad, string> = {
  transmitiendo: "Transmitiendo",
  detenida: "Sin recorrido activo",
  sin_senal: "Sin señal",
  equipo_caido: "Equipo sin reportar",
  sin_vincular: "Sin dispositivo vinculado",
};

export function idDeTarjeta(unidadId: string): string {
  return `tarjeta-unidad-${unidadId}`;
}

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

  const bateria = unidad.bateria_pct;
  const alertaBateria = bateriaEnAlerta(bateria, umbralBateriaPct);
  const ultimaSenal = describirUltimaSenal(unidad.segundos_sin_senal);
  const tono = alertaBateria ? "advertencia" : TONO_POR_SALUD[salud];
  const esFalla = salud === "sin_senal" || salud === "equipo_caido";
  const detalle = detallarFalla(
    salud,
    ultimaSenal,
    describirUltimaSenal(unidad.segundos_sin_latido),
  );

  return (
    <Tarjeta
      tono={tono}
      className={`flex flex-col gap-3 ${seleccionada ? "outline-2 outline-marca-profundo" : ""}`}
    >
      <Encabezado
        unidad={unidad}
        seleccionada={seleccionada}
        alVerEnMapa={alVerEnMapa}
      />

      {salud === "transmitiendo" ? (
        <dl className="flex gap-5">
          <Dato titulo="Velocidad" valor={formatearVelocidad(unidad.velocidad_kmh)} />
          <Dato titulo="Última señal" valor={ultimaSenal ?? "—"} />
          <Dato titulo="Batería" valor={bateria === null ? "—" : `${bateria} %`} />
        </dl>
      ) : (
        <p className={`text-xs font-bold ${esFalla ? "text-error" : "text-tinta-media"}`}>
          {LEYENDA_POR_SALUD[salud]}
          {detalle && ` · ${detalle}`}
        </p>
      )}

      {alertaBateria && (
        <p className="text-xs font-semibold text-advertencia-tinta">
          Batería en {bateria} % · revisar el cargador
        </p>
      )}
    </Tarjeta>
  );
}

function Encabezado({
  unidad,
  seleccionada,
  alVerEnMapa,
}: {
  unidad: EstadoUnidad;
  seleccionada: boolean;
  alVerEnMapa: (() => void) | null;
}) {
  const contenido = (
    <>
      <span
        aria-hidden="true"
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: colorDeRuta(unidad.ruta_color) }}
      />
      <span className="font-serif text-sm font-bold">{unidad.unidad_nombre}</span>
      <span className="truncate text-xs font-semibold text-tinta-suave">
        {unidad.ruta_nombre ?? "Sin ruta asignada"}
      </span>
    </>
  );

  if (!alVerEnMapa) {
    return (
      <div id={idDeTarjeta(unidad.unidad_id)} className="flex items-center gap-2.5">
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
      className="-m-2 flex min-h-10 scroll-my-16 items-center gap-2.5 rounded-lg p-2 text-left transition-colors duration-300 ease-out hover:bg-fondo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo"
    >
      {contenido}
      <span className="sr-only">: ver en el mapa</span>
    </button>
  );
}

/**
 * Las dos fallas se ven parecidas pero se arreglan distinto: "sin señal" es una
 * unidad en recorrido que dejó de mandar posiciones, y "equipo sin reportar" es
 * un teléfono que no da señales de vida estando estacionado. Decir cuál de las
 * dos fechas es la vieja evita que el gestor vaya al vehículo equivocado.
 */
function detallarFalla(
  salud: SaludUnidad,
  ultimaPosicion: string | null,
  ultimoLatido: string | null,
): string | null {
  if (salud === "sin_senal") {
    return ultimaPosicion && `última posición ${ultimaPosicion}`;
  }

  if (salud === "equipo_caido") {
    return ultimoLatido ? `último reporte ${ultimoLatido}` : "nunca ha reportado";
  }

  return null;
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[11px] font-bold text-tinta-suave">{titulo}</dt>
      <dd className="text-sm font-bold">{valor}</dd>
    </div>
  );
}

function formatearVelocidad(velocidad: number | null): string {
  return velocidad === null ? "—" : `${Math.round(velocidad)} km/h`;
}
