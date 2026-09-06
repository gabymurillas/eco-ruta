import { IndicadorKpi } from "@/components/ui/IndicadorKpi";
import { evaluarSalud } from "@/domain/flota";
import { MapaPendiente } from "@/features/monitoreo/components/MapaPendiente";
import { TarjetaUnidad } from "@/features/monitoreo/components/TarjetaUnidad";
import {
  contarIncidenciasActivas,
  obtenerEstadoDeFlota,
} from "@/services/flota.service";
import { obtenerParametros } from "@/services/parametros.service";

export const metadata = {
  title: "Monitoreo · EcoRuta administración",
};

// La telemetría cambia a cada segundo: servir una copia cacheada mostraría
// unidades donde ya no están.
export const dynamic = "force-dynamic";

export default async function MonitoreoPage() {
  const [flota, incidencias, parametros] = await Promise.all([
    obtenerEstadoDeFlota(),
    contarIncidenciasActivas(),
    obtenerParametros(),
  ]);

  if (!flota.ok) {
    return (
      <main className="flex flex-1 items-center justify-center p-7">
        <p role="alert" className="font-serif text-lg font-bold text-error">
          {flota.error}
        </p>
      </main>
    );
  }

  const valores = parametros.ok
    ? Object.fromEntries(parametros.datos.map((p) => [p.clave, Number(p.valor)]))
    : {};
  const umbralSinSenalS = valores.sin_senal_umbral_s ?? 300;
  const umbralBateriaPct = valores.bateria_alerta_pct ?? 15;

  const unidades = flota.datos;
  const enRecorrido = unidades.filter(
    (unidad) =>
      evaluarSalud({
        vinculado: unidad.dispositivo_vinculado,
        enRecorrido: unidad.en_recorrido,
        segundosSinSenal: unidad.segundos_sin_senal,
        umbralSinSenalS,
      }) === "transmitiendo",
  ).length;

  const alertasDeEquipo = unidades.filter(
    (unidad) =>
      (unidad.bateria_pct !== null && unidad.bateria_pct <= umbralBateriaPct) ||
      (unidad.en_recorrido &&
        (unidad.segundos_sin_senal === null ||
          unidad.segundos_sin_senal > umbralSinSenalS)),
  ).length;

  return (
    <>
      <header className="flex h-18 shrink-0 items-center justify-between gap-6 border-b-[0.5px] border-borde bg-superficie px-7">
        <div className="flex flex-col gap-px">
          <h1 className="font-serif text-[19px] font-black tracking-tight">
            Monitoreo en vivo
          </h1>
          <p className="text-xs font-semibold text-tinta-suave">
            {unidades.length} unidades registradas
          </p>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-5 overflow-hidden p-7">
        <div className="flex shrink-0 gap-4">
          <IndicadorKpi
            titulo="Unidades activas"
            valor={String(unidades.length)}
            detalle="registradas"
          />
          <IndicadorKpi
            titulo="En recorrido"
            valor={String(enRecorrido)}
            detalle="transmitiendo"
            tono={enRecorrido > 0 ? "exito" : "neutro"}
          />
          <IndicadorKpi
            titulo="Incidencias"
            valor={incidencias.ok ? String(incidencias.datos) : "—"}
            detalle="activas"
          />
          <IndicadorKpi
            titulo="Alertas de equipo"
            valor={String(alertasDeEquipo)}
            detalle="requieren revisión"
            tono={alertasDeEquipo > 0 ? "advertencia" : "neutro"}
          />
        </div>

        <div className="flex min-h-0 flex-1 gap-5">
          <MapaPendiente />

          <aside className="flex w-86 shrink-0 flex-col gap-3 overflow-y-auto rounded-2xl border-[0.5px] border-borde bg-superficie p-5">
            <h2 className="text-xs font-bold tracking-wide text-tinta-suave">Flota</h2>

            {unidades.length === 0 ? (
              <p className="text-sm text-tinta-media">
                Todavía no hay unidades registradas.
              </p>
            ) : (
              unidades.map((unidad) => (
                <TarjetaUnidad
                  key={unidad.unidad_id}
                  unidad={unidad}
                  umbralSinSenalS={umbralSinSenalS}
                  umbralBateriaPct={umbralBateriaPct}
                />
              ))
            )}
          </aside>
        </div>
      </div>
    </>
  );
}
