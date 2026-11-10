import { cookies } from "next/headers";
import { COOKIE_TEMA, leerTema } from "@/domain/tema";
import { FormularioContrasenaNueva } from "@/features/autenticacion/components/FormularioContrasenaNueva";
import { MarcoIngreso } from "@/features/autenticacion/components/MarcoIngreso";

export const metadata = {
  title: "Contraseña nueva · EcoRuta administración",
};

// Solo se llega con la sesión que abre el enlace del correo: el proxy manda al
// ingreso a quien entre sin sesión.
export default async function RestablecerPage() {
  const tema = leerTema((await cookies()).get(COOKIE_TEMA)?.value);

  return (
    <MarcoIngreso tema={tema} titulo="Elige una contraseña nueva" bajada="La usarás desde ahora para entrar al panel.">
      <FormularioContrasenaNueva />
    </MarcoIngreso>
  );
}
