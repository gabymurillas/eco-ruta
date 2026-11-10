import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_RECUPERACION } from "@/lib/recuperacion";
import { COOKIE_TEMA, leerTema } from "@/domain/tema";
import { FormularioContrasenaNueva } from "@/features/autenticacion/components/FormularioContrasenaNueva";
import { MarcoIngreso } from "@/features/autenticacion/components/MarcoIngreso";

export const metadata = {
  title: "Contraseña nueva · EcoRuta administración",
};

// Sin sesión, el proxy manda al ingreso. Con sesión pero sin haber abierto el
// enlace del correo (o pasados 15 minutos), se vuelve a pedirlo.
export default async function RestablecerPage() {
  const almacen = await cookies();

  if (!almacen.has(COOKIE_RECUPERACION)) {
    redirect("/admin/recuperar?error=enlace");
  }

  const tema = leerTema(almacen.get(COOKIE_TEMA)?.value);

  return (
    <MarcoIngreso tema={tema} titulo="Elige una contraseña nueva" bajada="La usarás desde ahora para entrar al panel.">
      <FormularioContrasenaNueva />
    </MarcoIngreso>
  );
}
