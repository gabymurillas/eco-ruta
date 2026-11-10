import { FallaDeCarga } from "@/components/ui/FallaDeCarga";
import { IndicadorKpi } from "@/components/ui/IndicadorKpi";
import { evaluarSalud, requiereRevision } from "@/domain/flota";
import { etiquetarTipoIncidencia } from "@/domain/incidencias";
import Link from "next/link";
import { IndicadorEnVivo } from "@/features/monitoreo/components/IndicadorEnVivo";
import { PanelFlota } from "@/features/monitoreo/components/PanelFlota";
import { TarjetaIncidencia } from "@/features/monitoreo/components/TarjetaIncidencia";
import { obtenerEstadoDeFlota } from "@/services/flota.service";
import { obtenerIncidenciasActivas } from "@/services/incidencias.service";
import { obtenerRutasDeMapa } from "@/services/mapa.service";
import { obtenerValoresDeParametros } from "@/services/parametros.service";

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
    obtenerValoresDeParametros(),
    obtenerRutasDeMapa(),
  ]);

  if (!flota.ok) {
    return <FallaDeCarga mensaje={flota.error} />;
  }

  const umbralSinSenalS = parametros.sin_senal_umbral_s;
  const umbralBateriaPct = parametros.bateria_alerta_pct;

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
  const vinculadas = unidades.filter((unidad) => unidad.dispositivo_vinculado).length;
  const incidenciasActivas = incidencias.ok ? incidencias.datos.length : null;

  const alertasDeEquipo = saludes.filter(({ unidad, salud }) =>
    requiereRevision(salud, unidad.bateria_pct, umbralBateriaPct),
  ).length;
  const primeraIncidencia = incidencias.ok ? incidencias.datos[0] : undefined;

  return (
    <div className="flex h-dvh min-h-0 flex-col gap-4 p-6">
      <header className="flex items-center gap-3.5">
        <h1 className="text-[26px] font-extrabold tracking-tight">Monitoreo</h1>
        <IndicadorEnVivo />
        <Link
          href="/admin/rutas/nueva"
          className="ml-auto flex h-10 items-center gap-2 rounded-[10px] bg-marca-profundo px-4 text-sm font-semibold text-superficie transition-[filter] duration-200 ease-out hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nueva ruta
        </Link>
      </header>

      <div className="grid shrink-0 grid-cols-4 gap-3.5">
        <IndicadorKpi
          titulo="Flota"
          valor={String(unidades.length)}
          detalle={`${vinculadas} con equipo vinculado`}
          icono={<><rect x="4" y="4" width="16" height="13" rx="3" /><path d="M4 11h16M8 20v-3M16 20v-3" /></>}
        />
        <IndicadorKpi
          titulo="En servicio"
          valor={String(enRecorrido)}
          detalle="transmitiendo ahora"
          tono={enRecorrido > 0 ? "exito" : "neutro"}
          icono={<path d="M3 12h4l3-8 4 16 3-8h4" />}
        />
        <IndicadorKpi
          titulo={incidenciasActivas === 1 ? "Incidencia activa" : "Incidencias activas"}
          valor={incidenciasActivas === null ? "—" : String(incidenciasActivas)}
          detalle={
            incidenciasActivas === null
              ? "no se pudieron cargar"
              : primeraIncidencia
                ? `${etiquetarTipoIncidencia(primeraIncidencia.tipo)} · ${primeraIncidencia.rutaNombre ?? "sin ruta"}`
                : "ninguna en este momento"
          }
          tono={incidenciasActivas ? "advertencia" : "neutro"}
          icono={<path d="M12 3l9 16H3zM12 10v4M12 17v.1" />}
        />
        <IndicadorKpi
          titulo="Alertas de equipo"
          valor={String(alertasDeEquipo)}
          detalle="sin señal o batería baja"
          tono={alertasDeEquipo > 0 ? "advertencia" : "neutro"}
          icono={<path d="M2 8.5a15 15 0 0 1 20 0M5.5 12a10 10 0 0 1 13 0M9 15.5a5 5 0 0 1 6 0M12 19v.1" />}
        />
      </div>

      <PanelFlota
        unidadesEnMapa={saludes
          // Sin coordenadas no hay nada que dibujar: una unidad recién
          // registrada que aún no transmitió no tiene posición.
          .filter(({ unidad }) => unidad.unidad_lat !== null && unidad.unidad_lng !== null)
          .map(({ unidad, salud }) => ({
            id: unidad.unidad_id,
            nombre: unidad.unidad_nombre,
            lat: unidad.unidad_lat,
            lng: unidad.unidad_lng,
            rutaNombre: unidad.ruta_nombre,
            color: unidad.ruta_color,
            icono: unidad.ruta_icono,
            transmitiendo: salud === "transmitiendo",
            segundosSinSenal: unidad.segundos_sin_senal,
            velocidadKmh: unidad.velocidad_kmh,
          }))}
        rutas={(rutasDeMapa.ok ? rutasDeMapa.datos : []).map((ruta) => ({
          id: ruta.ruta_id,
          nombre: ruta.ruta_nombre,
          color: ruta.ruta_color,
          trazado: ruta.trazado_geojson,
        }))}
        unidades={unidades}
        umbrales={{ sinSenalS: umbralSinSenalS, bateriaPct: umbralBateriaPct }}
        encabezado={
          // Van antes que la flota: una incidencia activa pide una decisión del
          // gestor, y la lista de unidades puede ser larga.
          incidencias.ok &&
          incidencias.datos.length > 0 && (
            <>
              <h2 className="text-[13px] font-semibold text-tinta-media">
                Incidencias activas
              </h2>
              {incidencias.datos.map((incidencia) => (
                <TarjetaIncidencia key={incidencia.id} incidencia={incidencia} />
              ))}
            </>
          )
        }
      />
    </div>
  );
}
