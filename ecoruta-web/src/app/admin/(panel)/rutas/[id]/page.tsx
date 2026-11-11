import { notFound } from "next/navigation";
import { FallaDeCarga } from "@/components/ui/FallaDeCarga";
import { trazadoALatLng } from "@/domain/mapa";
import { exigirAdminOVolver } from "@/features/autenticacion/guardas";
import { EditorDeRuta } from "@/features/rutas/components/EditorDeRuta";
import { obtenerParadasDeLaCiudad } from "@/services/catalogo-paradas.service";
import { obtenerValoresDeParametros } from "@/services/parametros.service";
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

export default async function EditorDeRutaPage({ params }: PageProps<"/admin/rutas/[id]">) {
  // El editor es de escritura de punta a punta. El operador ve el trazado y las
  // paradas de cada ruta en la lista de rutas.
  await exigirAdminOVolver("/admin/rutas");

  const { id } = await params;

  const [ruta, paradas, ciudad, puntosClave, viajes, parametros] = await Promise.all([
    obtenerRutaDeMapa(id),
    obtenerParadasDeRuta(id),
    obtenerParadasDeLaCiudad(),
    obtenerPuntosClave(id),
    obtenerViajesGrabados(id),
    obtenerValoresDeParametros(),
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
      distanciaParadaM={parametros.distancia_parada_trazado_m}
    />
  );
}
