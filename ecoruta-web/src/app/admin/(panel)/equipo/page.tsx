import { FallaDeCarga } from "@/components/ui/FallaDeCarga";
import { describirCuando, describirUltimoIngreso } from "@/domain/equipo";
import { exigirAdminOVolver } from "@/features/autenticacion/guardas";
import { SeccionEquipo } from "@/features/equipo/components/SeccionEquipo";
import { obtenerEquipo, type MiembroDelEquipo } from "@/services/equipo.service";

export const metadata = {
  title: "Equipo · EcoRuta administración",
};

export const dynamic = "force-dynamic";

export default async function EquipoPage() {
  await exigirAdminOVolver();

  const resultado = await obtenerEquipo();

  if (!resultado.ok) {
    return <FallaDeCarga mensaje={resultado.error} />;
  }

  return <SeccionEquipo miembros={conFechas(resultado.datos.miembros)} tuId={resultado.datos.tuId} />;
}

/**
 * El «hace cuánto» se calcula aquí, en el servidor, una sola vez: si lo calculara
 * el cliente, el HTML del servidor y el del navegador no coincidirían.
 */
function conFechas(miembros: MiembroDelEquipo[]) {
  const ahora = new Date();

  return miembros.map((miembro) => ({
    ...miembro,
    ultimoIngreso: describirUltimoIngreso(miembro.ultimoIngresoAt, ahora),
    invitadoHace: miembro.invitadoAt ? describirCuando(miembro.invitadoAt, ahora) : null,
  }));
}
