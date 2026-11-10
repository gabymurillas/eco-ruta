import { Seguimiento } from "@/features/seguimiento/components/Seguimiento";
import { obtenerValoresDeParametros } from "@/services/parametros.service";

export const metadata = {
  title: "EcoRuta San Juan",
  description:
    "Mira dónde está tu unidad y recibe un aviso cuando se acerque a tu parada, en San Juan de los Morros.",
};

/** Las rutas solo componen features: la lógica y los datos viven en la feature. */
export default async function SeguimientoPage() {
  const parametros = await obtenerValoresDeParametros();

  return (
    <Seguimiento
      umbralSinSenalS={parametros.sin_senal_umbral_s}
      radioAproximacionM={parametros.radio_aproximacion_m}
      penalizacionIncidenciaPct={parametros.penalizacion_incidencia_pct}
    />
  );
}
