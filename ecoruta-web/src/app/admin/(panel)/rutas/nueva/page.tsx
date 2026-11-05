import Link from "next/link";
import { radioMinimoSugeridoM } from "@/domain/parametros";
import { FormularioRuta } from "@/features/rutas/components/FormularioRuta";
import { obtenerParametros } from "@/services/parametros.service";
import { obtenerRutas } from "@/services/rutas.service";

export const metadata = {
  title: "Nueva ruta · EcoRuta administración",
};

const EXACTITUD_POR_DEFECTO_M = 50;

export default async function NuevaRutaPage() {
  const [parametros, rutas] = await Promise.all([obtenerParametros(), obtenerRutas()]);

  // Si los parámetros no cargan, se usa el valor por defecto del esquema en vez de
  // dejar la pantalla inservible: el radio sugerido es una guía, no un bloqueo.
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
          href="/admin/rutas"
          aria-label="Volver a rutas"
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
          <h1 className="font-serif text-[19px] font-black tracking-tight">Nueva ruta</h1>
          <p className="text-xs font-semibold text-tinta-suave">
            Rutas · Crear
          </p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-7">
        <FormularioRuta
          radioMinimoSugeridoM={radioMinimoSugeridoM(exactitudMaximaM)}
          exactitudMaximaM={exactitudMaximaM}
          // Si las rutas no cargan, el formulario sirve igual: solo no marca colores.
          coloresEnUso={
            rutas.ok ? rutas.datos.map((otra) => ({ color: otra.color, ruta: otra.nombre })) : []
          }
        />
      </main>
    </>
  );
}
