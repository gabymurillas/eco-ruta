import { FormularioParametros } from "@/features/parametros/components/FormularioParametros";
import { obtenerParametros } from "@/services/parametros.service";

export const metadata = {
  title: "Parámetros · EcoRuta administración",
};

export default async function ParametrosPage() {
  const resultado = await obtenerParametros();

  if (!resultado.ok) {
    return (
      <EncabezadoConMensaje
        mensaje={resultado.error}
        detalle="Vuelve a cargar la página. Si persiste, revisa la conexión con Supabase."
      />
    );
  }

  const valores = Object.fromEntries(
    resultado.datos.map(({ clave, valor }) => [clave, Number(valor)]),
  );

  return (
    <>
      <header className="flex h-18 shrink-0 items-center justify-between gap-6 border-b-[0.5px] border-borde bg-superficie px-7">
        <div className="flex flex-col gap-px">
          <h1 className="font-serif text-[19px] font-black tracking-tight">
            Parámetros del sistema
          </h1>
          <p className="text-xs font-semibold text-tinta-suave">
            Afectan a todas las rutas y unidades a la vez
          </p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-7">
        <div className="mx-auto max-w-4xl">
          <FormularioParametros valores={valores} />
        </div>
      </main>
    </>
  );
}

function EncabezadoConMensaje({
  mensaje,
  detalle,
}: {
  mensaje: string;
  detalle: string;
}) {
  return (
    <main className="flex flex-1 items-center justify-center p-7">
      <div className="flex max-w-md flex-col gap-2 text-center">
        <p role="alert" className="font-serif text-lg font-bold text-error">
          {mensaje}
        </p>
        <p className="text-sm text-tinta-media">{detalle}</p>
      </div>
    </main>
  );
}
