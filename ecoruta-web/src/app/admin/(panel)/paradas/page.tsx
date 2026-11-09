import { FallaDeCarga } from "@/components/ui/FallaDeCarga";
import { trazadoALatLng } from "@/domain/mapa";
import { radioMinimoSugeridoM } from "@/domain/parametros";
import { EditorDeParadas } from "@/features/paradas/components/EditorDeParadas";
import { obtenerParadasDeLaCiudad } from "@/services/catalogo-paradas.service";
import { obtenerRutasDeMapa } from "@/services/mapa.service";
import { obtenerParametros } from "@/services/parametros.service";

export const metadata = {
  title: "Paradas · EcoRuta administración",
};

export const dynamic = "force-dynamic";

const EXACTITUD_POR_DEFECTO_M = 50;

export default async function ParadasPage() {
  const [paradas, rutas, parametros] = await Promise.all([
    obtenerParadasDeLaCiudad(),
    obtenerRutasDeMapa(),
    obtenerParametros(),
  ]);

  if (!paradas.ok) {
    return <FallaDeCarga mensaje={paradas.error} />;
  }

  const exactitudMaximaM = parametros.ok
    ? Number(
        parametros.datos.find((p) => p.clave === "exactitud_maxima_m")?.valor ??
          EXACTITUD_POR_DEFECTO_M,
      )
    : EXACTITUD_POR_DEFECTO_M;
  const radioMinimoM = radioMinimoSugeridoM(exactitudMaximaM);

  return (
    <EditorDeParadas
      paradas={paradas.datos}
      trazados={
        rutas.ok
          ? rutas.datos.map((ruta) => ({
              id: ruta.ruta_id,
              color: ruta.ruta_color,
              puntos: trazadoALatLng(ruta.trazado_geojson),
            }))
          : []
      }
      radioPorDefectoM={radioMinimoM}
      radioMinimoM={radioMinimoM}
    />
  );
}
