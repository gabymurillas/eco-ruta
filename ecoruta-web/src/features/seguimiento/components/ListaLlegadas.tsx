import { formatearMinutos } from "@/domain/formato";
import { describirAntiguedad, type EstadoLlegada, type TiempoLlegada } from "@/domain/llegadas";
import type { EstadoLlegadas } from "../hooks/useLlegadas";
import {
  evaluarLlegadas,
  type AjustesDeLlegada,
  type LlegadaEvaluada,
} from "../llegadas-ordenadas";
import { CirculoRuta } from "./CirculoRuta";
import { useHoja } from "./HojaInferior";

type Props = AjustesDeLlegada & { estado: EstadoLlegadas };

/**
 * La llegada más próxima en grande, que es lo que se ve con la hoja abajo; el
 * resto debajo, ordenado por tiempo. «Estimado» acompaña siempre a la cifra.
 */
export function ListaLlegadas({ estado, ...ajustes }: Props) {
  const { llegadas, falla } = estado;

  if (llegadas === null) {
    return falla ? (
      <p className="text-sm leading-relaxed text-error" role="alert">
        No pudimos cargar las llegadas. Lo volvemos a intentar solo en unos
        segundos; revisa tu conexión.
      </p>
    ) : (
      <p className="text-sm text-tinta-media" role="status">
        Buscando unidades en camino…
      </p>
    );
  }

  if (llegadas.length === 0) {
    return (
      <div className="flex flex-col gap-1.5">
        <p className="text-[19px] font-extrabold leading-tight tracking-tight">
          Ninguna unidad va hacia tu parada ahora
        </p>
        <p className="text-sm leading-relaxed text-tinta-media">
          Si sale una, aparece aquí sola. No hace falta recargar.
        </p>
      </div>
    );
  }

  const [primera, ...resto] = evaluarLlegadas(llegadas, ajustes);

  return (
    <>
      {falla && (
        <p className="text-xs font-semibold text-advertencia-tinta" role="status">
          No pudimos actualizar. Lo que ves puede estar atrasado; seguimos
          intentando.
        </p>
      )}

      <Llegada llegada={primera} grande />

      {resto.length > 0 && <Resto resto={resto} total={llegadas.length} />}
    </>
  );
}

function Resto({ resto, total }: { resto: LlegadaEvaluada[]; total: number }) {
  const { nivel, cambiarNivel } = useHoja();

  return (
    <>
      {nivel === "baja" && (
        <button
          type="button"
          onClick={() => cambiarNivel("media")}
          className="flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-full border border-borde text-[15px] font-bold hover:bg-marca-tenue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo lg:hidden"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m18 15-6-6-6 6" />
          </svg>
          Ver las {total} llegadas
        </button>
      )}

      <div className="h-px shrink-0 bg-borde-suave" />

      <ul className="flex flex-col gap-2.5">
        {resto.map((llegada) => (
          <li
            key={llegada.fila.unidad_id}
            className={`rounded-2xl border px-3.5 py-3 ${
              llegada.estado.tipo === "senal_perdida" ? "border-advertencia-borde" : "border-borde-suave"
            }`}
          >
            <Llegada llegada={llegada} />
          </li>
        ))}
      </ul>
    </>
  );
}

function Llegada({ llegada, grande = false }: { llegada: LlegadaEvaluada; grande?: boolean }) {
  const { fila, estado, tiempo } = llegada;
  const apagado = estado.tipo !== "en_camino" || tiempo.tipo === "ya_paso";

  return (
    <div className="flex flex-col gap-2">
      <div className={`flex items-center ${grande ? "gap-3.5" : "gap-3"}`}>
        <CirculoRuta color={fila.ruta_color} icono={fila.ruta_icono} grande={grande} apagado={apagado} />

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span
            className={`truncate font-extrabold tracking-tight ${grande ? "text-[19px]" : "text-[15px]"} ${
              apagado ? "text-tinta-media" : ""
            }`}
          >
            {fila.ruta_nombre}
          </span>
          <span className="truncate text-xs font-semibold text-tinta-suave">
            {fila.unidad_nombre}
            {fila.ultima_parada && ` · pasó por ${fila.ultima_parada}`}
          </span>
        </div>

        <TiempoEstimado estado={estado} tiempo={tiempo} grande={grande} />
      </div>

      {estado.tipo === "senal_perdida" && <AvisoSenalPerdida estado={estado} />}
      {tiempo.tipo === "minutos" && tiempo.conIncidencia && (
        <p className="text-xs font-semibold text-advertencia-tinta">
          Hay una incidencia en esta ruta: el tiempo estimado ya suma un margen por ella.
        </p>
      )}
    </div>
  );
}

const MINUTOS_POR_HORA = 60;

function TiempoEstimado({
  estado,
  tiempo,
  grande,
}: {
  estado: EstadoLlegada;
  tiempo: TiempoLlegada;
  grande: boolean;
}) {
  if (estado.tipo === "sin_recorrido") {
    return <Etiqueta texto="Sin recorrido activo" />;
  }

  if (estado.tipo === "senal_perdida") {
    return <span className="shrink-0 text-xs font-bold text-advertencia-tinta">Sin confirmar</span>;
  }

  if (tiempo.tipo === "ya_paso") {
    return <Etiqueta texto="Ya pasó por aquí" />;
  }

  // Sin trazado no hay distancia confiable: se dice que viene en vez de inventar
  // un número.
  if (tiempo.tipo === "sin_estimado") {
    return <span className="shrink-0 text-xs font-bold">En camino</span>;
  }

  return (
    <span className="flex shrink-0 flex-col items-end leading-none">
      <span className={`font-extrabold tabular-nums tracking-tight ${grande ? "text-[40px]" : "text-[22px]"}`}>
        {cifra(tiempo.minutos)}
      </span>
      <span className="pt-1 text-xs font-bold text-tinta-suave">estimado</span>
    </span>
  );
}

/**
 * «~6 min» con la unidad más chica que la cifra. Pasada la hora («~1 h 20 min»)
 * el texto entero baja de tamaño para caber junto al nombre de la ruta.
 */
function cifra(minutos: number) {
  if (minutos === 0) {
    return <span className="text-[0.55em]">Llegando</span>;
  }

  if (minutos >= MINUTOS_POR_HORA) {
    return <span className="text-[0.55em]">~{formatearMinutos(minutos)}</span>;
  }

  return (
    <>
      ~{minutos}
      <span className="ml-0.5 text-[0.4em] font-bold tracking-normal">min</span>
    </>
  );
}

function Etiqueta({ texto }: { texto: string }) {
  return <span className="shrink-0 text-xs font-bold text-tinta-media">{texto}</span>;
}

function AvisoSenalPerdida({ estado }: { estado: EstadoLlegada }) {
  const antiguedad =
    estado.tipo === "senal_perdida" ? describirAntiguedad(estado.segundosSinSenal) : null;

  return (
    <p className="flex items-start gap-2 text-xs font-semibold leading-snug text-advertencia-tinta">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="mt-px shrink-0" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 1.8" />
      </svg>
      {antiguedad
        ? `Última posición ${antiguedad}. Puede seguir en camino, pero no podemos confirmarlo.`
        : "Inició el recorrido pero todavía no envía su posición."}
    </p>
  );
}
