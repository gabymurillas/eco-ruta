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
};

const TONO_POR_SALUD: Record<SaludUnidad, "neutro" | "advertencia" | "error"> = {
  transmitiendo: "neutro",
  detenida: "neutro",
  sin_senal: "error",
  sin_vincular: "neutro",
};

const LEYENDA_POR_SALUD: Record<SaludUnidad, string> = {
  transmitiendo: "Transmitiendo",
  detenida: "Sin recorrido activo",
  sin_senal: "Sin señal",
  sin_vincular: "Sin dispositivo vinculado",
};

export function TarjetaUnidad({ unidad, umbralSinSenalS, umbralBateriaPct }: Props) {
  const salud = evaluarSalud({
    vinculado: unidad.dispositivo_vinculado,
    enRecorrido: unidad.en_recorrido,
    segundosSinSenal: unidad.segundos_sin_senal,
    umbralSinSenalS,
  });

  const bateria = unidad.bateria_pct;
  const alertaBateria = bateriaEnAlerta(bateria, umbralBateriaPct);
  const ultimaSenal = describirUltimaSenal(unidad.segundos_sin_senal);
  const tono = alertaBateria ? "advertencia" : TONO_POR_SALUD[salud];

  return (
    <Tarjeta tono={tono} className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: colorDeRuta(unidad.ruta_color) }}
        />
        <span className="font-serif text-sm font-bold">{unidad.unidad_nombre}</span>
        <span className="truncate text-xs font-semibold text-tinta-suave">
          {unidad.ruta_nombre ?? "Sin ruta asignada"}
        </span>
      </div>

      {salud === "transmitiendo" ? (
        <dl className="flex gap-5">
          <Dato titulo="Velocidad" valor={formatearVelocidad(unidad.velocidad_kmh)} />
          <Dato titulo="Última señal" valor={ultimaSenal ?? "—"} />
          <Dato titulo="Batería" valor={bateria === null ? "—" : `${bateria} %`} />
        </dl>
      ) : (
        <p
          className={`text-xs font-bold ${salud === "sin_senal" ? "text-error" : "text-tinta-media"}`}
        >
          {LEYENDA_POR_SALUD[salud]}
          {ultimaSenal && salud === "sin_senal" && ` · última posición ${ultimaSenal}`}
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
