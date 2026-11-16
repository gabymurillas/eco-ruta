const PUNTOS = [
  {
    titulo: "El tiempo es un estimado",
    detalle:
      "Se calcula con la posición que envía el teléfono de cada unidad. Si hay tráfico o una parada larga, puede variar.",
  },
  {
    titulo: "Si una unidad pierde señal, te lo decimos",
    detalle:
      "Cuando su teléfono deja de transmitir, la verás marcada como «sin señal» en vez de mostrarte una posición vieja.",
  },
  {
    titulo: "Los avisos llegan con la página abierta",
    detalle:
      "No enviamos notificaciones al teléfono: deja EcoRuta abierta mientras esperas.",
  },
  {
    titulo: "Tu privacidad",
    detalle:
      "No tienes cuenta ni te pedimos datos personales. Tu ubicación solo se usa para encontrar las paradas cercanas y no la guardamos; tu parada se recuerda solo en este navegador.",
  },
];

/**
 * Las limitaciones dichas antes de que el ciudadano las descubra: un dato
 * equivocado destruye la confianza más que uno ausente (PRODUCT.md). Lo de
 * privacidad repite, en corto, docs/06-legal/privacidad.md; si ese texto
 * cambia, este también.
 */
export function LoQueConvieneSaber() {
  return (
    <section aria-labelledby="titulo-conviene-saber" className="flex flex-col gap-6">
      <h2
        id="titulo-conviene-saber"
        className="text-[1.5rem] leading-tight font-extrabold tracking-tight"
      >
        Lo que conviene saber
      </h2>

      <dl className="grid gap-x-10 gap-y-6 md:grid-cols-2">
        {PUNTOS.map((punto) => (
          <div key={punto.titulo} className="flex flex-col gap-1.5 border-t border-borde pt-4">
            <dt className="text-[0.9375rem] font-bold">{punto.titulo}</dt>
            <dd className="text-[0.9375rem] leading-relaxed text-tinta-media">
              {punto.detalle}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
