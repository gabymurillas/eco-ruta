import { FallaDeCarga } from "@/components/ui/FallaDeCarga";
import { puedeEditarElPanel } from "@/features/autenticacion/guardas";
import { SeccionLetreros } from "@/features/letreros/components/SeccionLetreros";
import { obtenerLetreros } from "@/services/letreros.service";
import { obtenerUnidades } from "@/services/unidades.service";

export const metadata = {
  title: "Letreros · EcoRuta administración",
};

export const dynamic = "force-dynamic";

export default async function LetrerosPage() {
  const [letreros, unidades, puedeEditar] = await Promise.all([
    obtenerLetreros(),
    obtenerUnidades(),
    puedeEditarElPanel(),
  ]);

  if (!letreros.ok) {
    return <FallaDeCarga mensaje={letreros.error} />;
  }

  if (!unidades.ok) {
    return <FallaDeCarga mensaje={unidades.error} />;
  }

  // Al cliente solo viaja lo que muestra la lista de casillas: nada del teléfono.
  const opciones = unidades.datos.map((unidad) => ({
    id: unidad.id,
    nombre: unidad.nombre,
    activa: unidad.activa,
    rutaNombre: unidad.rutaNombre,
    rutaColor: unidad.rutaColor,
    rutaIcono: unidad.rutaIcono,
  }));

  return <SeccionLetreros letreros={letreros.datos} unidades={opciones} puedeEditar={puedeEditar} />;
}
