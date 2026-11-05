import { FallaDeCarga } from "@/components/ui/FallaDeCarga";
import Link from "next/link";
import { IconoRuta } from "@/components/ui/IconoRuta";
import { colorDeRuta, tintaSobreColorDeRuta } from "@/domain/colores";
import { obtenerRutas } from "@/services/rutas.service";

export const metadata = {
  title: "Rutas · EcoRuta administración",
};

export const dynamic = "force-dynamic";

export default async function RutasPage() {
  const resultado = await obtenerRutas();

  if (!resultado.ok) {
    return <FallaDeCarga mensaje={resultado.error} />;
  }

  const rutas = resultado.datos;
  const sinTrazado = rutas.filter((ruta) => !ruta.tieneTrazado).length;

  return (
    <>
      <header className="flex h-18 shrink-0 items-center justify-between gap-6 border-b-[0.5px] border-borde bg-superficie px-7">
        <div className="flex flex-col gap-px">
          <h1 className="font-serif text-[19px] font-black tracking-tight">
            Rutas
          </h1>
          <p className="text-xs font-semibold text-tinta-suave">
            {rutas.length} rutas registradas
            {sinTrazado > 0 && ` · ${sinTrazado} sin trazado`}
          </p>
        </div>

        <Link
          href="/admin/rutas/nueva"
          className="inline-flex h-10 items-center gap-2 rounded-full bg-marca-profundo px-5 text-sm font-bold text-superficie transition-[filter] duration-300 ease-out hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo"
        >
          Nueva ruta
        </Link>
      </header>

      <main className="flex-1 overflow-y-auto p-7">
        {rutas.length === 0 ? (
          <p className="text-sm text-tinta-media">
            Todavía no hay rutas. Crea la primera para que el ciudadano pueda verla.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {rutas.map((ruta) => (
              <li
                key={ruta.id}
                className="flex items-center gap-4 rounded-2xl border-[0.5px] border-borde bg-superficie p-4"
              >
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: colorDeRuta(ruta.color),
                    color: tintaSobreColorDeRuta(ruta.color),
                  }}
                >
                  <IconoRuta icono={ruta.icono} tamano={20} />
                </span>

                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="font-serif text-base font-bold">{ruta.nombre}</span>
                  <span className="text-xs font-semibold text-tinta-suave">
                    {ruta.tipo ?? "Sin tipo declarado"} · {ruta.cantidadParadas} paradas ·{" "}
                    {ruta.cantidadUnidades} unidades
                  </span>
                </div>

                {!ruta.tieneTrazado && (
                  <span className="rounded-full border-[0.5px] border-advertencia-borde bg-advertencia-fondo px-3 py-1 text-xs font-bold text-advertencia-tinta">
                    Sin trazado
                  </span>
                )}

                {!ruta.activa && (
                  <span className="rounded-full border-[0.5px] border-borde px-3 py-1 text-xs font-bold text-tinta-suave">
                    Inactiva
                  </span>
                )}

                <Link
                  href={`/admin/rutas/${ruta.id}`}
                  className="inline-flex h-10 shrink-0 items-center rounded-full border-[0.5px] border-borde px-4 text-[13px] font-bold text-marca-profundo transition-colors duration-300 ease-out hover:bg-marca-tenue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo"
                >
                  Trazado y paradas
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
