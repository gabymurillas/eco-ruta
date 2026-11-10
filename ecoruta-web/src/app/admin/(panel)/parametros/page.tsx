import { FallaDeCarga } from "@/components/ui/FallaDeCarga";
import { valoresConRespaldo } from "@/domain/parametros";
import { FormularioParametros } from "@/features/parametros/components/FormularioParametros";
import { obtenerParametros } from "@/services/parametros.service";

export const metadata = {
  title: "Parámetros · EcoRuta administración",
};

export const dynamic = "force-dynamic";

export default async function ParametrosPage() {
  // Aquí no se usan los valores de respaldo si la tabla no carga: mostrar los de
  // fábrica como si fueran los vigentes invitaría a «guardar» algo que nadie eligió.
  const resultado = await obtenerParametros();

  if (!resultado.ok) {
    return <FallaDeCarga mensaje={resultado.error} />;
  }

  return <FormularioParametros valores={valoresConRespaldo(resultado.datos)} />;
}
