import Link from "next/link";
import { FallaDeCarga } from "@/components/ui/FallaDeCarga";
import { IndicadorKpi } from "@/components/ui/IndicadorKpi";
import { formatearMinutos } from "@/domain/formato";
import {
  apilarPorDia,
  describirRango,
  diasDelPeriodo,
  leerPeriodo,
  PERIODOS,
  type Periodo,
} from "@/domain/historicos";
import { GraficoViajesPorDia, type RutaDelGrafico } from "@/features/historicos/components/GraficoViajesPorDia";
import { TablaPorRuta } from "@/features/historicos/components/TablaPorRuta";
import {
  obtenerResumen,
  obtenerResumenPorRuta,
  obtenerViajesPorDia,
  type ResumenHistoricos,
} from "@/services/historicos.service";

export const metadata = {
  title: "Históricos · EcoRuta administración",
};

export const dynamic = "force-dynamic";

export default async function HistoricosPage({ searchParams }: PageProps<"/admin/historicos">) {
  const periodo = leerPeriodo([(await searchParams).dias].flat()[0]);
  const [resumen, porDia, porRuta] = await Promise.all([
    obtenerResumen(periodo),
    obtenerViajesPorDia(periodo),
    obtenerResumenPorRuta(periodo),
  ]);

  if (!resumen.ok) {
    return <FallaDeCarga mensaje={resumen.error} />;
  }

  const dias = diasDelPeriodo(periodo, new Date());
  const filasPorDia = porDia.ok ? porDia.datos : [];
  const rutas = rutasDelGrafico(filasPorDia);

  return (
    <div className="flex min-h-dvh flex-col gap-4 p-6">
      <header className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <h1 className="text-[26px] font-extrabold tracking-tight">Históricos</h1>
        <PestanasPeriodo elegido={periodo} />
        <p className="ml-auto text-sm text-tinta-media">{describirRango(dias)}</p>
      </header>

      <Indicadores resumen={resumen.datos} periodo={periodo} />

      <div className="flex min-h-0 flex-1 flex-wrap gap-4">
        <section className="flex min-w-[420px] flex-1 flex-col gap-3 rounded-2xl border border-borde bg-superficie pt-4">
          <h2 className="px-5 text-base font-bold">Viajes por día</h2>
          {porDia.ok ? (
            <GraficoViajesPorDia dias={apilarPorDia(filasPorDia, dias, rutas.map((r) => r.id))} rutas={rutas} />
          ) : (
            <p role="alert" className="p-5 text-sm text-error">{porDia.error}</p>
          )}
        </section>

        <section className="flex w-full flex-col rounded-2xl border border-borde bg-superficie xl:w-[560px]">
          <h2 className="px-4 pt-4 pb-3 text-base font-bold">Por ruta</h2>
          {porRuta.ok ? (
            <TablaPorRuta filas={porRuta.datos} />
          ) : (
            <p role="alert" className="px-4 pb-4 text-sm text-error">{porRuta.error}</p>
          )}
          <NotaCobertura />
        </section>
      </div>
    </div>
  );
}

/** El orden de la pila es por nombre: estable entre días y entre períodos. */
function rutasDelGrafico(filas: readonly { ruta_id: string; ruta_nombre: string; ruta_color: string }[]): RutaDelGrafico[] {
  const rutas = new Map(filas.map((f) => [f.ruta_id, { id: f.ruta_id, nombre: f.ruta_nombre, color: f.ruta_color }]));
  return [...rutas.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

function Indicadores({ resumen, periodo }: { resumen: ResumenHistoricos; periodo: Periodo }) {
  // Total y activas salen de la misma consulta: «resueltas» no puede quedar negativa.
  const activas = resumen.incidencias_activas;
  const duracion = resumen.duracion_promedio_min;

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <IndicadorKpi
        titulo="Viajes completados"
        valor={String(resumen.viajes_completados)}
        detalle={`${Math.round(resumen.viajes_completados / periodo)} por día en promedio`}
        icono={<path d="M3 12h4l3-8 4 16 3-8h4" />}
      />
      <IndicadorKpi
        titulo="Duración promedio"
        valor={duracion === null ? "—" : formatearMinutos(Math.round(Number(duracion)))}
        detalle="por viaje completado"
        icono={<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>}
      />
      <IndicadorKpi
        titulo="Cobertura de paradas"
        valor={resumen.cobertura_pct === null ? "—" : `${Math.round(Number(resumen.cobertura_pct))} %`}
        detalle={`${resumen.paradas_visitadas} de ${resumen.paradas_planificadas} pasos por parada`}
        icono={<><path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></>}
      />
      <IndicadorKpi
        titulo="Incidencias"
        valor={String(resumen.incidencias)}
        detalle={`${resumen.incidencias - activas} resueltas · ${activas} activas`}
        icono={<><path d="M12 3l9 16H3z" /><path d="M12 10v4M12 17v.1" /></>}
        tono={activas ? "advertencia" : "neutro"}
      />
    </div>
  );
}

function PestanasPeriodo({ elegido }: { elegido: Periodo }) {
  return (
    <nav aria-label="Período" className="flex gap-1 rounded-xl border border-borde bg-superficie p-1">
      {PERIODOS.map((periodo) => {
        const activo = periodo === elegido;
        return (
          <Link
            key={periodo}
            href={periodo === PERIODOS[0] ? "/admin/historicos" : `/admin/historicos?dias=${periodo}`}
            aria-current={activo ? "page" : undefined}
            className={`rounded-[9px] px-3 py-1.5 text-[13px] font-semibold transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo ${
              activo ? "bg-marca-profundo text-superficie" : "text-tinta-media hover:bg-fondo hover:text-tinta"
            }`}
          >
            {periodo} días
          </Link>
        );
      })}
    </nav>
  );
}

function NotaCobertura() {
  return (
    <div className="mx-4 mt-auto mb-4 flex flex-col gap-1.5 rounded-[10px] border border-borde bg-fondo p-3 text-[12.5px] leading-relaxed text-tinta-media">
      <p>
        <strong className="font-bold text-tinta">Cobertura:</strong> de las paradas que cada viaje
        completado debía tocar, en cuántas el sistema registró la llegada. Con 3 paradas y 10 viajes, son 30
        pasos.
      </p>
      <p>
        No dice si la unidad se detuvo ni si pasó a la hora prevista. Depende del radio de la
        geocerca: al comparar períodos, verifica que los parámetros no cambiaron.
      </p>
    </div>
  );
}
