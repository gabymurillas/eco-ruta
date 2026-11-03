import Link from "next/link";
import { notFound } from "next/navigation";
import { trazadoALatLng } from "@/domain/mapa";
import { EditorDeRuta } from "@/features/rutas/components/EditorDeRuta";
import { obtenerParadasDeLaCiudad } from "@/services/catalogo-paradas.service";
import {
  obtenerParadasDeRuta,
  obtenerPuntosClave,
  obtenerRutaDeMapa,
  obtenerViajesGrabados,
} from "@/services/rutas.service";

export const dynamic = "force-dynamic";

export default async function EditorDeRutaPage({ params }: PageProps<"/admin/rutas/[id]">) {
  const { id } = await params;

  const [ruta, paradas, ciudad, puntosClave, viajes] = await Promise.all([
    obtenerRutaDeMapa(id),
    obtenerParadasDeRuta(id),
    obtenerParadasDeLaCiudad(),
    obtenerPuntosClave(id),
    obtenerViajesGrabados(id),
  ]);

  if (!ruta.ok || !ruta.datos) {
    notFound();
  }

  if (!paradas.ok || !ciudad.ok) {
    return (
      <main className="flex flex-1 items-center justify-center p-7">
        <p role="alert" className="font-serif text-lg font-bold text-error">
          {paradas.ok ? (ciudad.ok ? null : ciudad.error) : paradas.error}
        </p>
      </main>
    );
  }

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
            Trazado · pasa por {paradas.datos.length} paradas
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
          trazadoInicial={trazadoALatLng(ruta.datos.trazado_geojson)}
          puntosClave={puntosClave.ok ? puntosClave.datos : []}
          viajes={viajes.ok ? viajes.datos : []}
          paradasDeRuta={paradas.datos}
          paradasDeLaCiudad={ciudad.datos.map(({ id: paradaId, nombre, lat, lng }) => ({
            id: paradaId,
            nombre,
            lat,
            lng,
          }))}
        />
      </main>
    </>
  );
}
