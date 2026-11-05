import { FallaDeCarga } from "@/components/ui/FallaDeCarga";
import { IndicadorKpi } from "@/components/ui/IndicadorKpi";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { GraficoViajesPorDia } from "@/features/historicos/components/GraficoViajesPorDia";
import { obtenerResumen, obtenerViajesPorDia } from "@/services/historicos.service";

export const metadata = {
  title: "Históricos · EcoRuta administración",
};

export const dynamic = "force-dynamic";

const DIAS = 7;

export default async function HistoricosPage() {
  const [resumen, porDia] = await Promise.all([
    obtenerResumen(DIAS),
    obtenerViajesPorDia(DIAS),
  ]);

  if (!resumen.ok) {
    return <FallaDeCarga mensaje={resumen.error} />;
  }

  const datos = resumen.datos;
  const cobertura = datos.cobertura_pct;

  return (
    <>
      <header className="flex h-18 shrink-0 items-center justify-between gap-6 border-b-[0.5px] border-borde bg-superficie px-7">
        <div className="flex flex-col gap-px">
          <h1 className="font-serif text-[19px] font-black tracking-tight">Históricos</h1>
          <p className="text-xs font-semibold text-tinta-suave">
            Últimos {DIAS} días · todas las rutas
          </p>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-5 overflow-y-auto p-7">
        <div className="flex gap-4">
          <IndicadorKpi
            titulo="Viajes completados"
            valor={String(datos.viajes_completados)}
            detalle="en el período"
          />
          <IndicadorKpi
            titulo="Duración promedio"
            valor={
              datos.duracion_promedio_min === null
                ? "—"
                : String(Math.round(Number(datos.duracion_promedio_min)))
            }
            detalle="min por recorrido"
          />
          <IndicadorKpi
            titulo="Cobertura de paradas"
            valor={cobertura === null ? "—" : `${cobertura} %`}
            detalle={`${datos.paradas_visitadas} de ${datos.paradas_planificadas}`}
          />
          <IndicadorKpi
            titulo="Incidencias"
            valor={String(datos.incidencias)}
            detalle="en el período"
          />
        </div>

        <Tarjeta className="flex flex-col gap-4 p-5">
          <h2 className="font-serif text-[15px] font-bold">Viajes por día</h2>
          {porDia.ok ? (
            <GraficoViajesPorDia filas={porDia.datos} />
          ) : (
            <p role="alert" className="text-sm text-error">
              {porDia.error}
            </p>
          )}
        </Tarjeta>

        <Tarjeta className="flex flex-col gap-2 p-5">
          <h2 className="font-serif text-[15px] font-bold">
            Qué mide la cobertura de paradas
          </h2>
          <p className="text-xs leading-relaxed text-tinta-media">
            Paradas con registro de llegada sobre paradas planificadas de cada viaje. Si
            una ruta tiene 3 paradas y hubo 10 viajes, son 30 planificadas.
          </p>
          <p className="text-xs leading-relaxed text-tinta-media">
            No dice si la unidad se detuvo, si alguien subió, ni si pasó a la hora
            prevista: solo que estuvo dentro del radio de la geocerca el tiempo suficiente
            para que el sistema lo registrara.
          </p>
          <p className="text-xs leading-relaxed text-tinta-media">
            <strong className="font-bold">Depende del radio de geocerca:</strong> achicarlo
            baja la cobertura sin que el servicio haya empeorado. Al comparar dos períodos,
            verifica que los parámetros no cambiaron entre ellos.
          </p>
        </Tarjeta>
      </main>
    </>
  );
}
