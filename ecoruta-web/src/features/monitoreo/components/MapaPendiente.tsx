/**
 * Marcador de posición del mapa.
 *
 * El mapa ya no depende de ninguna clave: Leaflet dibuja sobre teselas de
 * OpenStreetMap sin cuenta. Lo que falta es que las funciones de PostGIS devuelvan
 * coordenadas — `sql/04_funciones.sql` ya las incluye, pero la migración está sin
 * aplicar porque el proyecto de Supabase quedó pausado.
 *
 * Se dice qué falta en vez de dibujar un mapa vacío que parecería un error.
 */
export function MapaPendiente() {
  return (
    <div className="flex size-full items-center justify-center rounded-2xl border-[0.5px] border-borde bg-fondo p-8">
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-tinta-suave"
          aria-hidden="true"
        >
          <path d="M4 7.5l5.5-2.5 5 2.5 5.5-2.5v11.5l-5.5 2.5-5-2.5L4 19z" />
          <path d="M9.5 5v14M14.5 7.5v14" />
        </svg>

        <p className="font-serif text-base font-bold">Falta aplicar la migración</p>
        <p className="text-xs leading-relaxed text-tinta-media">
          Las funciones de PostGIS todavía no devuelven coordenadas, así que no hay nada
          que dibujar. Corre <code className="font-mono">sql/04_funciones.sql</code> y
          regenera los tipos con <code className="font-mono">npm run types:db</code>. Los
          datos de abajo ya son reales.
        </p>
      </div>
    </div>
  );
}
