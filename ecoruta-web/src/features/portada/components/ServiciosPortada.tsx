import { IconoRuta } from "@/components/ui/IconoRuta";

const SERVICIOS = [
  {
    icono: "bus",
    titulo: "Transporte público",
    detalle: "Las rutas de autobuses y busetas que pasan por tu parada.",
  },
  {
    icono: "camion",
    titulo: "Recolección de aseo",
    detalle: "El camión del aseo, para que saques la basura a tiempo.",
  },
];

/**
 * Los servicios van en tinta y no en color de ruta: aquí no representan una
 * ruta concreta, y el terracota es de marca, no de servicio.
 */
export function ServiciosPortada() {
  return (
    <section aria-labelledby="titulo-servicios" className="flex flex-col gap-6">
      <h2
        id="titulo-servicios"
        className="text-[1.5rem] leading-tight font-extrabold tracking-tight"
      >
        Qué puedes seguir
      </h2>

      <ul className="grid gap-4 md:grid-cols-2">
        {SERVICIOS.map((servicio) => (
          <li
            key={servicio.titulo}
            className="flex items-start gap-4 rounded-xl border border-borde bg-superficie p-5"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-borde text-tinta">
              <IconoRuta icono={servicio.icono} tamano={24} />
            </span>
            <div className="flex flex-col gap-1">
              <h3 className="text-[1.1875rem] font-extrabold tracking-tight">
                {servicio.titulo}
              </h3>
              <p className="text-[0.9375rem] leading-relaxed text-tinta-media">
                {servicio.detalle}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <p className="text-[0.9375rem] leading-relaxed text-tinta-media">
        La alcaldía puede sumar otros servicios con recorrido, como las cisternas
        de agua o la distribución de gas.
      </p>
    </section>
  );
}
