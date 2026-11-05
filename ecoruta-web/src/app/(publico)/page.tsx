import { Seguimiento } from "@/features/seguimiento/components/Seguimiento";
import { obtenerParametros } from "@/services/parametros.service";

export const metadata = {
  title: "EcoRuta San Juan",
  description:
    "Mira dónde está tu unidad y recibe un aviso cuando se acerque a tu parada, en San Juan de los Morros.",
};

/** Valores de respaldo si los parámetros no cargan: coinciden con los del esquema. */
const UMBRAL_SIN_SENAL_POR_DEFECTO_S = 300;
const RADIO_APROXIMACION_POR_DEFECTO_M = 500;
const PENALIZACION_INCIDENCIA_POR_DEFECTO_PCT = 25;

/** Las rutas solo componen features: la lógica y los datos viven en la feature. */
export default async function SeguimientoPage() {
  const parametros = await obtenerParametros();
  const valores = new Map(
    parametros.ok
      ? parametros.datos.map((p) => [p.clave, Number(p.valor)])
      : [],
  );

  return (
    <Seguimiento
      umbralSinSenalS={
        valores.get("sin_senal_umbral_s") ?? UMBRAL_SIN_SENAL_POR_DEFECTO_S
      }
      radioAproximacionM={
        valores.get("radio_aproximacion_m") ?? RADIO_APROXIMACION_POR_DEFECTO_M
      }
      penalizacionIncidenciaPct={
        valores.get("penalizacion_incidencia_pct") ??
        PENALIZACION_INCIDENCIA_POR_DEFECTO_PCT
      }
    />
  );
}
