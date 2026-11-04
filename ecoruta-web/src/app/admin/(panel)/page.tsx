import { IndicadorKpi } from "@/components/ui/IndicadorKpi";
import { bateriaEnAlerta, evaluarSalud } from "@/domain/flota";
import { IndicadorEnVivo } from "@/features/monitoreo/components/IndicadorEnVivo";
import { MapaFlota } from "@/features/monitoreo/components/MapaFlota";
import { TarjetaIncidencia } from "@/features/monitoreo/components/TarjetaIncidencia";
import { TarjetaUnidad } from "@/features/monitoreo/components/TarjetaUnidad";
import { obtenerEstadoDeFlota } from "@/services/flota.service";
import { obtenerIncidenciasActivas } from "@/services/incidencias.service";
import { obtenerRutasDeMapa } from "@/services/mapa.service";
import { obtenerParametros } from "@/services/parametros.service";

export const metadata = {
  title: "Monitoreo · EcoRuta administración",
};

// La telemetría cambia a cada segundo: servir una copia cacheada mostraría
// unidades donde ya no están.
export const dynamic = "force-dynamic";

export default async function MonitoreoPage() {
  const [flota, incidencias, parametros, rutasDeMapa] = await Promise.all([
    obtenerEstadoDeFlota(),
    obtenerIncidenciasActivas(),
    obtenerParametros(),
    obtenerRutasDeMapa(),
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

  // La salud se evalúa una sola vez por unidad y de aquí salen los dos KPI. Antes
  // el contador de alertas repetía la regla a mano y se quedaba atrás cada vez que
  // la regla cambiaba.
  const saludes = unidades.map((unidad) => ({
    unidad,
    salud: evaluarSalud({
      vinculado: unidad.dispositivo_vinculado,
      enRecorrido: unidad.en_recorrido,
      segundosSinSenal: unidad.segundos_sin_senal,
      segundosSinLatido: unidad.segundos_sin_latido,
      umbralSinSenalS,
    }),
  }));

  const enRecorrido = saludes.filter((u) => u.salud === "transmitiendo").length;

  const alertasDeEquipo = saludes.filter(
    ({ unidad, salud }) =>
      bateriaEnAlerta(unidad.bateria_pct, umbralBateriaPct) ||
      salud === "sin_senal" ||
      salud === "equipo_caido",
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
        <IndicadorEnVivo />
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
            valor={incidencias.ok ? String(incidencias.datos.length) : "—"}
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
          <MapaFlota
            unidades={unidades
              // Sin coordenadas no hay nada que dibujar: una unidad recien
              // registrada que aun no transmitio no tiene posicion.
              .filter((unidad) => unidad.unidad_lat !== null && unidad.unidad_lng !== null)
              .map((unidad) => ({
                id: unidad.unidad_id,
                nombre: unidad.unidad_nombre,
                lat: unidad.unidad_lat,
                lng: unidad.unidad_lng,
                rutaNombre: unidad.ruta_nombre,
                color: unidad.ruta_color,
                icono: unidad.ruta_icono,
                transmitiendo:
                  unidad.en_recorrido &&
                  unidad.segundos_sin_senal !== null &&
                  unidad.segundos_sin_senal <= umbralSinSenalS,
                segundosSinSenal: unidad.segundos_sin_senal,
                velocidadKmh: unidad.velocidad_kmh,
              }))}
            rutas={(rutasDeMapa.ok ? rutasDeMapa.datos : []).map((ruta) => ({
              id: ruta.ruta_id,
              nombre: ruta.ruta_nombre,
              color: ruta.ruta_color,
              trazado: ruta.trazado_geojson,
            }))}
          />

          <aside className="flex w-86 shrink-0 flex-col gap-3 overflow-y-auto rounded-2xl border-[0.5px] border-borde bg-superficie p-5">
            {/* Van antes que la flota: una incidencia activa pide una decisión del
                gestor, y la lista de unidades puede ser larga. */}
            {incidencias.ok && incidencias.datos.length > 0 && (
              <>
                <h2 className="text-xs font-bold tracking-wide text-tinta-suave">
                  Incidencias activas
                </h2>
                {incidencias.datos.map((incidencia) => (
                  <TarjetaIncidencia key={incidencia.id} incidencia={incidencia} />
                ))}
              </>
            )}

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
