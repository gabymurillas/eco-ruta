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
    <>
      <header className="flex h-18 shrink-0 items-center border-b-[0.5px] border-borde bg-superficie px-7">
        <div className="flex flex-col gap-px">
          <h1 className="font-serif text-[19px] font-black tracking-tight">Paradas</h1>
          <p className="text-xs font-semibold text-tinta-suave">
            Las rutas pasan por las paradas que toca su trazado. No hace falta asignarlas.
          </p>
        </div>
      </header>

      <main className="min-h-0 flex-1 p-7">
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
      </main>
    </>
  );
}
