import { notFound } from "next/navigation";
import { FallaDeCarga } from "@/components/ui/FallaDeCarga";
import { trazadoALatLng } from "@/domain/mapa";
import { EditorDeRuta } from "@/features/rutas/components/EditorDeRuta";
import { obtenerParadasDeLaCiudad } from "@/services/catalogo-paradas.service";
import { obtenerParametros } from "@/services/parametros.service";
import {
  obtenerParadasDeRuta,
  obtenerPuntosClave,
  obtenerRutaDeMapa,
  obtenerViajesGrabados,
} from "@/services/rutas.service";

export const metadata = {
  title: "Trazado y paradas · EcoRuta administración",
};

export const dynamic = "force-dynamic";

// El mismo valor por defecto que usa la vista `paradas_por_ruta` (sql/04).
const DISTANCIA_PARADA_POR_DEFECTO_M = 40;

export default async function EditorDeRutaPage({ params }: PageProps<"/admin/rutas/[id]">) {
  const { id } = await params;

  const [ruta, paradas, ciudad, puntosClave, viajes, parametros] = await Promise.all([
    obtenerRutaDeMapa(id),
    obtenerParadasDeRuta(id),
    obtenerParadasDeLaCiudad(),
    obtenerPuntosClave(id),
    obtenerViajesGrabados(id),
    obtenerParametros(),
  ]);

  if (!ruta.ok || !ruta.datos) {
    notFound();
  }

  if (!paradas.ok) {
    return <FallaDeCarga mensaje={paradas.error} />;
  }
  if (!ciudad.ok) {
    return <FallaDeCarga mensaje={ciudad.error} />;
  }

  const distancia = parametros.ok
    ? parametros.datos.find((p) => p.clave === "distancia_parada_trazado_m")?.valor
    : undefined;

  return (
    <EditorDeRuta
      rutaId={id}
      rutaNombre={ruta.datos.ruta_nombre}
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
      distanciaParadaM={Number(distancia ?? DISTANCIA_PARADA_POR_DEFECTO_M)}
    />
  );
}
