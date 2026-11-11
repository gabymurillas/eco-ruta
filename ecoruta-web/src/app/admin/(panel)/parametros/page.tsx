import { FallaDeCarga } from "@/components/ui/FallaDeCarga";
import { exigirAdminOVolver } from "@/features/autenticacion/guardas";
import { FormularioParametros } from "@/features/parametros/components/FormularioParametros";
import { obtenerParametros } from "@/services/parametros.service";

export const metadata = {
  title: "Parámetros · EcoRuta administración",
};

export const dynamic = "force-dynamic";

export default async function ParametrosPage() {
  await exigirAdminOVolver();

  // Aquí no hay valores de respaldo: mostrar los de fábrica como si fueran los
  // vigentes invitaría a «guardar» algo que nadie eligió. Si la tabla no carga, se
  // dice; si falta una clave, el formulario la pide vacía.
  const resultado = await obtenerParametros();

  if (!resultado.ok) {
    return <FallaDeCarga mensaje={resultado.error} />;
  }

  return (
    <FormularioParametros
      valores={Object.fromEntries(resultado.datos.map(({ clave, valor }) => [clave, Number(valor)]))}
    />
  );
}
