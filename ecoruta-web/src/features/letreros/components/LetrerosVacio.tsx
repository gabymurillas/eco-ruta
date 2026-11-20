type Props = {
  puedeEditar: boolean;
};

const PASOS = [
  "Crea el letrero con el texto del cartel, por ejemplo «Terminal – Villa Olímpica».",
  "En «Unidades», marca qué unidades pueden usarlo.",
  "El conductor lo elige desde la app y la web lo muestra junto al nombre de la ruta.",
];

/** Sin letreros todavía: explica qué son antes de pedir que se cree el primero. */
export function LetrerosVacio({ puedeEditar }: Props) {
  return (
    <div className="flex max-w-xl flex-col gap-4 p-6">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[19px] leading-tight font-extrabold">Todavía no hay letreros</h2>
        <p className="text-sm leading-relaxed text-tinta-media">
          Un letrero es el nombre que lleva el cartel de la unidad según adónde la mandan. La
          unidad sigue en su ruta, con sus paradas y su tiempo estimado; solo cambia el
          nombre que se ve.
        </p>
      </div>

      <p className="flex flex-col gap-1 rounded-[10px] border border-borde bg-fondo p-3 text-sm">
        <span className="text-xs font-bold text-tinta-suave">Ejemplo de cómo se ve en la web</span>
        <span>
          <span className="font-bold">Ruta Centro</span>
          <span className="text-tinta-media"> · Terminal – Villa Olímpica</span>
        </span>
      </p>

      {puedeEditar ? (
        <ol className="flex flex-col gap-2.5">
          {PASOS.map((paso, indice) => (
            <li key={paso} className="flex items-start gap-2.5 text-[13.5px] leading-snug">
              <span
                aria-hidden="true"
                className="grid size-6 shrink-0 place-items-center rounded-full bg-marca-profundo text-xs font-bold text-superficie"
              >
                {indice + 1}
              </span>
              {paso}
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-tinta-media">Los crea un administrador.</p>
      )}
    </div>
  );
}
