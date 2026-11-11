import { FallaDeCarga } from "@/components/ui/FallaDeCarga";
import { trazadoALatLng } from "@/domain/mapa";
import { radioMinimoSugeridoM } from "@/domain/parametros";
import { puedeEditarElPanel } from "@/features/autenticacion/guardas";
import { EditorDeParadas } from "@/features/paradas/components/EditorDeParadas";
import { obtenerParadasDeLaCiudad } from "@/services/catalogo-paradas.service";
import { obtenerRutasDeMapa } from "@/services/mapa.service";
import { obtenerValoresDeParametros } from "@/services/parametros.service";

export const metadata = {
  title: "Paradas · EcoRuta administración",
};

export const dynamic = "force-dynamic";

export default async function ParadasPage() {
  const [paradas, rutas, parametros, puedeEditar] = await Promise.all([
    obtenerParadasDeLaCiudad(),
    obtenerRutasDeMapa(),
    obtenerValoresDeParametros(),
    puedeEditarElPanel(),
  ]);

  if (!paradas.ok) {
    return <FallaDeCarga mensaje={paradas.error} />;
  }

  const radioMinimoM = radioMinimoSugeridoM(parametros.exactitud_maxima_m);

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
      soloLectura={!puedeEditar}
    />
  );
}
