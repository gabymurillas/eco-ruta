import { FallaDeCarga } from "@/components/ui/FallaDeCarga";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FormularioRuta } from "@/features/rutas/components/FormularioRuta";
import { obtenerRutas } from "@/services/rutas.service";

export const metadata = {
  title: "Datos de la ruta · EcoRuta administración",
};

export const dynamic = "force-dynamic";

export default async function DatosDeRutaPage({
  params,
}: PageProps<"/admin/rutas/[id]/datos">) {
  const { id } = await params;
  const rutas = await obtenerRutas();

  if (!rutas.ok) {
    return <FallaDeCarga mensaje={rutas.error} />;
  }

  const ruta = rutas.datos.find((candidata) => candidata.id === id);

  if (!ruta) {
    notFound();
  }

  return (
    <>
      <header className="flex h-18 shrink-0 items-center gap-4 border-b-[0.5px] border-borde bg-superficie px-7">
        <Link
          href={`/admin/rutas/${id}`}
          aria-label="Volver al trazado y las paradas"
          className="flex size-10 items-center justify-center rounded-full border-[0.5px] border-borde transition-colors duration-300 ease-out hover:bg-marca-tenue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>

        <div className="flex flex-col gap-px">
          <h1 className="font-serif text-[19px] font-black tracking-tight">
            Datos de {ruta.nombre}
          </h1>
          <p className="text-xs font-semibold text-tinta-suave">
            Nombre, tipo de servicio, color e ícono
          </p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-7">
        <FormularioRuta
          coloresEnUso={rutas.datos
            .filter((otra) => otra.id !== ruta.id)
            .map((otra) => ({ color: otra.color, ruta: otra.nombre }))}
          ruta={{
            id: ruta.id,
            nombre: ruta.nombre,
            tipo: ruta.tipo,
            icono: ruta.icono,
            color: ruta.color,
            horario: ruta.horario,
          }}
        />
      </main>
    </>
  );
}
