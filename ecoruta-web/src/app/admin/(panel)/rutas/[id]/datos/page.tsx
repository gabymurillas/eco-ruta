import { FallaDeCarga } from "@/components/ui/FallaDeCarga";
import Link from "next/link";
import { notFound } from "next/navigation";
import { radioMinimoSugeridoM } from "@/domain/parametros";
import { FormularioRuta } from "@/features/rutas/components/FormularioRuta";
import { obtenerParametros } from "@/services/parametros.service";
import { obtenerRutas } from "@/services/rutas.service";

export const dynamic = "force-dynamic";

const EXACTITUD_POR_DEFECTO_M = 50;

export default async function DatosDeRutaPage({
  params,
}: PageProps<"/admin/rutas/[id]/datos">) {
  const { id } = await params;
  const [rutas, parametros] = await Promise.all([obtenerRutas(), obtenerParametros()]);

  if (!rutas.ok) {
    return <FallaDeCarga mensaje={rutas.error} />;
  }

  const ruta = rutas.datos.find((candidata) => candidata.id === id);

  if (!ruta) {
    notFound();
  }

  const exactitudMaximaM = parametros.ok
    ? Number(
        parametros.datos.find((p) => p.clave === "exactitud_maxima_m")?.valor ??
          EXACTITUD_POR_DEFECTO_M,
      )
    : EXACTITUD_POR_DEFECTO_M;

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
          radioMinimoSugeridoM={radioMinimoSugeridoM(exactitudMaximaM)}
          exactitudMaximaM={exactitudMaximaM}
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
