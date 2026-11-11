import Link from "next/link";
import { FallaDeCarga } from "@/components/ui/FallaDeCarga";
import { agruparPorTipo, claveDeTipo, type GrupoDeTipo } from "@/domain/fichas-rutas";
import { puedeEditarElPanel } from "@/features/autenticacion/guardas";
import { TarjetaRuta } from "@/features/rutas/components/TarjetaRuta";
import { obtenerFichasDeRutas } from "@/services/fichas-rutas.service";

export const metadata = {
  title: "Rutas · EcoRuta administración",
};

// Las unidades en servicio cambian a cada rato.
export const dynamic = "force-dynamic";

export default async function RutasPage({ searchParams }: PageProps<"/admin/rutas">) {
  const tipoElegido = [(await searchParams).tipo].flat()[0] ?? "";
  const [resultado, puedeEditar] = await Promise.all([obtenerFichasDeRutas(), puedeEditarElPanel()]);

  if (!resultado.ok) {
    return <FallaDeCarga mensaje={resultado.error} />;
  }

  const rutas = resultado.datos;
  const conTrazado = rutas.filter((ruta) => ruta.trazado.length >= 2).length;
  const grupos = agruparPorTipo(rutas);
  const visibles = tipoElegido ? rutas.filter((ruta) => claveDeTipo(ruta.tipo) === tipoElegido) : rutas;

  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex items-center gap-3.5">
        <h1 className="text-[26px] font-extrabold tracking-tight">Rutas</h1>
        <p className="text-sm text-tinta-media">
          {rutas.length === 1 ? "1 ruta" : `${rutas.length} rutas`} · {conTrazado} con trazado
        </p>
        {puedeEditar && (
        <Link
          href="/admin/rutas/nueva"
          className="ml-auto flex h-10 items-center gap-2 rounded-[10px] bg-marca-profundo px-4 text-sm font-semibold text-superficie transition-[filter] duration-200 ease-out hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nueva ruta
        </Link>
        )}
      </header>

      {/* Con un solo tipo, filtrar no separa nada. */}
      {grupos.length > 1 && (
        <PestanasTipo grupos={grupos} elegido={tipoElegido} total={rutas.length} />
      )}

      {rutas.length === 0 ? (
        <p className="rounded-2xl border border-borde bg-superficie p-6 text-sm text-tinta-media">
          {puedeEditar
            ? "Todavía no hay rutas. Crea la primera, dibuja su trazado y los ciudadanos podrán verla."
            : "Todavía no hay rutas. Las crea un administrador."}
        </p>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {visibles.map((ruta) => (
            <TarjetaRuta key={ruta.id} ruta={ruta} puedeEditar={puedeEditar} />
          ))}
        </div>
      )}
    </div>
  );
}

function PestanasTipo({ grupos, elegido, total }: { grupos: GrupoDeTipo[]; elegido: string; total: number }) {
  const pestanas = [{ clave: "", texto: "Todas", cantidad: total }, ...grupos];

  return (
    <nav aria-label="Tipo de ruta" className="flex w-fit gap-1 rounded-xl border border-borde bg-superficie p-1">
      {pestanas.map(({ clave, texto, cantidad }) => {
        const activa = clave === elegido;
        return (
          <Link
            key={clave || "todas"}
            href={clave ? `/admin/rutas?tipo=${encodeURIComponent(clave)}` : "/admin/rutas"}
            aria-current={activa ? "page" : undefined}
            className={`rounded-[9px] px-3 py-1.5 text-[13px] font-semibold transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo ${
              activa ? "bg-marca-profundo text-superficie" : "text-tinta-media hover:bg-fondo hover:text-tinta"
            }`}
          >
            {texto} <span className="opacity-70">{cantidad}</span>
          </Link>
        );
      })}
    </nav>
  );
}
