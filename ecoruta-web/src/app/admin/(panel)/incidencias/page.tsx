import Link from "next/link";
import { FallaDeCarga } from "@/components/ui/FallaDeCarga";
import {
  contarPorEstado,
  filtrarPorEstado,
  leerEstadoIncidencia,
  leerPeriodo,
  type EstadoIncidencia,
} from "@/domain/incidencias";
import { DetalleIncidencia } from "@/features/incidencias/components/DetalleIncidencia";
import { FiltrosIncidencias } from "@/features/incidencias/components/FiltrosIncidencias";
import { TablaIncidencias } from "@/features/incidencias/components/TablaIncidencias";
import { obtenerIncidencias } from "@/services/incidencias.service";
import { obtenerRutasDeMapa } from "@/services/mapa.service";
import { obtenerValoresDeParametros } from "@/services/parametros.service";
import { obtenerRutas } from "@/services/rutas.service";

export const metadata = {
  title: "Incidencias · EcoRuta administración",
};

// Un chofer puede reportar en cualquier momento: una copia cacheada escondería
// justo la incidencia que el gestor vino a resolver.
export const dynamic = "force-dynamic";

const PESTANAS: { valor: EstadoIncidencia; texto: string }[] = [
  { valor: "activas", texto: "Activas" },
  { valor: "resueltas", texto: "Resueltas" },
  { valor: "todas", texto: "Todas" },
];

type Filtros = { estado: EstadoIncidencia; periodo: number; rutaId: string };

/** Arma la URL de la página conservando los filtros; los valores por defecto no se escriben. */
function enlaceIncidencias(filtros: Filtros, id?: string): string {
  const parametros = new URLSearchParams();
  if (filtros.estado !== "activas") parametros.set("estado", filtros.estado);
  if (filtros.periodo !== 7) parametros.set("periodo", String(filtros.periodo));
  if (filtros.rutaId) parametros.set("ruta", filtros.rutaId);
  if (id) parametros.set("id", id);
  const texto = parametros.toString();
  return texto ? `/admin/incidencias?${texto}` : "/admin/incidencias";
}

export default async function IncidenciasPage({ searchParams }: PageProps<"/admin/incidencias">) {
  const url = await searchParams;
  const leer = (clave: string) => [url[clave]].flat()[0];

  const filtros: Filtros = {
    estado: leerEstadoIncidencia(leer("estado")),
    periodo: leerPeriodo(leer("periodo")),
    rutaId: leer("ruta") ?? "",
  };

  const [incidencias, rutas, rutasDeMapa, parametros] = await Promise.all([
    obtenerIncidencias(filtros.periodo),
    obtenerRutas(),
    obtenerRutasDeMapa(),
    obtenerValoresDeParametros(),
  ]);

  if (!incidencias.ok) {
    return <FallaDeCarga mensaje={incidencias.error} />;
  }

  const deLaRuta = incidencias.datos.filter((i) => !filtros.rutaId || i.rutaId === filtros.rutaId);
  const conteo = contarPorEstado(deLaRuta);
  const visibles = filtrarPorEstado(deLaRuta, filtros.estado);
  const elegida = visibles.find((i) => i.id === leer("id")) ?? visibles[0];

  const trazado = rutasDeMapa.ok
    ? rutasDeMapa.datos.find((r) => r.ruta_id === elegida?.rutaId)?.trazado_geojson
    : undefined;

  return (
    <div className="flex h-dvh min-h-0 flex-col gap-4 p-6">
      <header className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <h1 className="text-[26px] font-extrabold tracking-tight">Incidencias</h1>
        <PestanasEstado filtros={filtros} conteo={conteo} />
        <div className="ml-auto">
          <FiltrosIncidencias
            rutas={rutas.ok ? rutas.datos.map((r) => ({ id: r.id, nombre: r.nombre })) : []}
            rutaId={filtros.rutaId}
            periodo={filtros.periodo}
          />
        </div>
      </header>

      <p className="-mt-2 text-[13px] text-tinta-media">
        Las activas se muestran siempre, sin importar cuándo se reportaron. Las resueltas, solo
        las de los últimos {filtros.periodo} días.
      </p>

      <div className="flex min-h-0 flex-1 gap-4">
        <section
          aria-label="Lista de incidencias"
          className="min-w-0 flex-1 overflow-y-auto rounded-2xl border border-borde bg-superficie"
        >
          <TablaIncidencias
            incidencias={visibles}
            elegidaId={elegida?.id}
            enlaceDe={(id) => enlaceIncidencias(filtros, id)}
            estado={filtros.estado}
            periodo={filtros.periodo}
          />
        </section>

        {elegida && (
          <DetalleIncidencia
            incidencia={elegida}
            trazado={trazado ?? null}
            penalizacionPct={parametros.penalizacion_incidencia_pct}
          />
        )}
      </div>
    </div>
  );
}

function PestanasEstado({ filtros, conteo }: { filtros: Filtros; conteo: Record<EstadoIncidencia, number> }) {
  return (
    <nav aria-label="Estado" className="flex gap-1 rounded-xl border border-borde bg-superficie p-1">
      {PESTANAS.map(({ valor, texto }) => {
        const activa = valor === filtros.estado;
        return (
          <Link
            key={valor}
            href={enlaceIncidencias({ ...filtros, estado: valor })}
            aria-current={activa ? "page" : undefined}
            className={`rounded-[9px] px-3 py-1.5 text-[13px] font-semibold transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo ${
              activa ? "bg-marca-profundo text-superficie" : "text-tinta-media hover:bg-fondo hover:text-tinta"
            }`}
          >
            {texto} <span className="opacity-70">{conteo[valor]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
