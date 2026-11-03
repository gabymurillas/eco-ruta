import Link from "next/link";
import { notFound } from "next/navigation";
import { radioMinimoSugeridoM } from "@/domain/parametros";
import { trazadoALatLng } from "@/domain/mapa";
import { EditorDeRuta } from "@/features/rutas/components/EditorDeRuta";
import { obtenerParametros } from "@/services/parametros.service";
import { obtenerParadasDeRuta, obtenerRutaDeMapa } from "@/services/rutas.service";

export const dynamic = "force-dynamic";

const EXACTITUD_POR_DEFECTO_M = 50;

export default async function EditorDeRutaPage({ params }: PageProps<"/admin/rutas/[id]">) {
  const { id } = await params;

  const [ruta, paradas, parametros] = await Promise.all([
    obtenerRutaDeMapa(id),
    obtenerParadasDeRuta(id),
    obtenerParametros(),
  ]);

  if (!ruta.ok || !ruta.datos) {
    notFound();
  }

  if (!paradas.ok) {
    return (
      <main className="flex flex-1 items-center justify-center p-7">
        <p role="alert" className="font-serif text-lg font-bold text-error">
          {paradas.error}
        </p>
      </main>
    );
  }

  const exactitudMaximaM = parametros.ok
    ? Number(
        parametros.datos.find((p) => p.clave === "exactitud_maxima_m")?.valor ??
          EXACTITUD_POR_DEFECTO_M,
      )
    : EXACTITUD_POR_DEFECTO_M;

  return (
    <>
      <header className="flex h-18 shrink-0 items-center gap-4 border-b-[0.5px] border-borde bg-superficie px-7">
        <Link
          href="/admin/rutas"
          aria-label="Volver a rutas"
          className="flex size-10 items-center justify-center rounded-full border-[0.5px] border-borde transition-colors duration-300 ease-out hover:bg-marca-tenue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>

        <div className="flex flex-col gap-px">
          <h1 className="font-serif text-[19px] font-black tracking-tight">
            {ruta.datos.ruta_nombre}
          </h1>
          <p className="text-xs font-semibold text-tinta-suave">
            Trazado y paradas · {paradas.datos.length} paradas
          </p>
        </div>

        <Link
          href={`/admin/rutas/${id}/datos`}
          className="ml-auto inline-flex h-10 items-center rounded-full border-[0.5px] border-borde px-4 text-[13px] font-bold text-marca-profundo transition-colors duration-300 ease-out hover:bg-marca-tenue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo"
        >
          Editar datos
        </Link>
      </header>

      <main className="min-h-0 flex-1 p-7">
        <EditorDeRuta
          rutaId={id}
          color={ruta.datos.ruta_color}
          paradasIniciales={paradas.datos.map((parada) => ({
            id: parada.parada_id,
            nombre: parada.parada_nombre,
            lat: parada.parada_lat,
            lng: parada.parada_lng,
            radioM: parada.radio_geocerca_m,
          }))}
          trazadoInicial={trazadoALatLng(ruta.datos.trazado_geojson)}
          radioPorDefectoM={radioMinimoSugeridoM(exactitudMaximaM)}
          radioMinimoM={radioMinimoSugeridoM(exactitudMaximaM)}
        />
      </main>
    </>
  );
}
