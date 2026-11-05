import { FallaDeCarga } from "@/components/ui/FallaDeCarga";
import { FormularioUnidad } from "@/features/unidades/components/FormularioUnidad";
import { TablaUnidades } from "@/features/unidades/components/TablaUnidades";
import { obtenerRutas } from "@/services/rutas.service";
import { obtenerUnidades } from "@/services/unidades.service";

export const metadata = {
  title: "Unidades · EcoRuta administración",
};

export const dynamic = "force-dynamic";

export default async function UnidadesPage() {
  const [resultado, rutas] = await Promise.all([obtenerUnidades(), obtenerRutas()]);

  if (!resultado.ok) {
    return <FallaDeCarga mensaje={resultado.error} />;
  }

  const unidades = resultado.datos;
  const vinculadas = unidades.filter((unidad) => unidad.vinculado).length;

  return (
    <>
      <header className="flex h-18 shrink-0 items-center justify-between gap-6 border-b-[0.5px] border-borde bg-superficie px-7">
        <div className="flex flex-col gap-px">
          <h1 className="font-serif text-[19px] font-black tracking-tight">
            Unidades y dispositivos
          </h1>
          <p className="text-xs font-semibold text-tinta-suave">
            {unidades.length} unidades registradas · {vinculadas} con dispositivo
            vinculado
          </p>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-6 overflow-y-auto p-7">
        <TablaUnidades unidades={unidades} />

        <div className="max-w-md">
          <FormularioUnidad
            rutas={(rutas.ok ? rutas.datos : []).map((ruta) => ({
              id: ruta.id,
              nombre: ruta.nombre,
            }))}
          />
        </div>
      </main>
    </>
  );
}
