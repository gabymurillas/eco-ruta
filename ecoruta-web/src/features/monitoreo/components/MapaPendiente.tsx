/**
 * Marcador de posición del mapa.
 *
 * El mapa real usa Mapbox y necesita `NEXT_PUBLIC_MAPBOX_TOKEN`, que todavía no está
 * configurado. En vez de romper la pantalla o dibujar un mapa falso, se dice qué falta:
 * el resto del monitoreo (indicadores, flota, salud de equipos) funciona sin él.
 */
export function MapaPendiente() {
  return (
    <div className="flex flex-1 items-center justify-center rounded-2xl border-[0.5px] border-borde bg-fondo p-8">
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

        <p className="font-serif text-base font-bold">Falta la clave de Mapbox</p>
        <p className="text-xs leading-relaxed text-tinta-media">
          Agrega <code className="font-mono">NEXT_PUBLIC_MAPBOX_TOKEN</code> a{" "}
          <code className="font-mono">.env.local</code> para ver las unidades sobre el
          mapa. Los datos de abajo ya son reales.
        </p>
      </div>
    </div>
  );
}
