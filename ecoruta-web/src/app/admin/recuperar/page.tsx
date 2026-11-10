import { cookies } from "next/headers";
import { COOKIE_TEMA, leerTema } from "@/domain/tema";
import { FormularioRecuperar } from "@/features/autenticacion/components/FormularioRecuperar";
import { MarcoIngreso } from "@/features/autenticacion/components/MarcoIngreso";

export const metadata = {
  title: "Recuperar contraseña · EcoRuta administración",
};

type Props = { searchParams: Promise<{ error?: string | string[] }> };

export default async function RecuperarPage({ searchParams }: Props) {
  const tema = leerTema((await cookies()).get(COOKIE_TEMA)?.value);
  const enlaceFallido = [(await searchParams).error].flat()[0] === "enlace";

  return (
    <MarcoIngreso
      tema={tema}
      titulo="Recupera tu contraseña"
      bajada="Te mandamos un enlace al correo de tu cuenta para que elijas otra."
    >
      <FormularioRecuperar enlaceFallido={enlaceFallido} />
    </MarcoIngreso>
  );
}
