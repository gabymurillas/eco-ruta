const PASOS = [
  {
    titulo: "Elige tu parada",
    detalle:
      "Comparte tu ubicación y te mostramos las paradas cercanas. No necesitas cuenta ni contraseña.",
  },
  {
    titulo: "Mira tu unidad en vivo",
    detalle:
      "Ves en el mapa las unidades que van hacia tu parada y el tiempo estimado que les falta.",
  },
  {
    titulo: "Te avisamos cuando se acerca",
    detalle:
      "Mientras tengas la página abierta, te avisamos en pantalla cuando tu unidad está cerca y cuando ya pasó.",
  },
];

/** Los tres pasos del uso, en el orden en que pasan. Numerados: son una secuencia. */
export function ComoFunciona() {
  return (
    <section aria-labelledby="titulo-como-funciona" className="flex flex-col gap-6">
      <h2
        id="titulo-como-funciona"
        className="text-[1.5rem] leading-tight font-extrabold tracking-tight"
      >
        Cómo funciona
      </h2>

      <ol className="grid gap-4 md:grid-cols-3">
        {PASOS.map((paso, indice) => (
          <li
            key={paso.titulo}
            className="flex flex-col gap-3 rounded-xl border border-borde bg-superficie p-5"
          >
            <span
              aria-hidden="true"
              className="flex size-9 items-center justify-center rounded-full bg-marca-tenue text-[0.9375rem] font-extrabold text-marca-profundo"
            >
              {indice + 1}
            </span>
            <h3 className="text-[1.1875rem] font-extrabold tracking-tight">
              {paso.titulo}
            </h3>
            <p className="text-[0.9375rem] leading-relaxed text-tinta-media">
              {paso.detalle}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
