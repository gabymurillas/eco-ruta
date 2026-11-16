import Link from "next/link";

/**
 * La misma marca que la cabecera del mapa, pero sin «En vivo»: la portada no
 * muestra datos. El nombre enlaza al mapa, que es la portada de uso diario.
 */
export function CabeceraPortada() {
  return (
    <header className="border-b border-borde bg-superficie pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-14 max-w-[1152px] items-center px-4 md:px-6">
        <Link
          href="/"
          aria-label="EcoRuta: ir al mapa"
          className="-mx-2 flex min-h-12 items-center gap-2 rounded-full px-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo"
        >
          <span aria-hidden="true" className="size-2 rounded-full bg-marca" />
          <span className="text-[1.125rem] font-extrabold tracking-tight">EcoRuta</span>
          <span className="hidden text-xs font-semibold text-tinta-suave sm:inline">
            San Juan de los Morros
          </span>
        </Link>
      </div>
    </header>
  );
}
