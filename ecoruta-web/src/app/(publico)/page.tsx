import { Seguimiento } from "@/features/seguimiento/components/Seguimiento";
import { obtenerParametros } from "@/services/parametros.service";

export const metadata = {
  title: "EcoRuta San Juan",
  description:
    "Mira dónde está tu unidad y cuánto falta para que llegue a tu parada, en San Juan de los Morros.",
};

/** Valor de respaldo si los parámetros no cargan: coincide con el del esquema. */
const UMBRAL_SIN_SENAL_POR_DEFECTO_S = 300;

/** Las rutas solo componen features: la lógica y los datos viven en la feature. */
export default async function SeguimientoPage() {
  const parametros = await obtenerParametros();

  const umbralSinSenalS = parametros.ok
    ? Number(
        parametros.datos.find((p) => p.clave === "sin_senal_umbral_s")?.valor ??
          UMBRAL_SIN_SENAL_POR_DEFECTO_S,
      )
    : UMBRAL_SIN_SENAL_POR_DEFECTO_S;

  return <Seguimiento umbralSinSenalS={umbralSinSenalS} />;
}
