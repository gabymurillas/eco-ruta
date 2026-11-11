type Props = {
  motivo: "negada" | "fallida" | "no_disponible" | "sin_paradas";
};

const MENSAJES: Record<Props["motivo"], { titulo: string; detalle: string }> = {
  negada: {
    titulo: "Necesitamos tu ubicación",
    detalle:
      "Sin tu ubicación no podemos saber qué paradas tienes cerca. Actívala en los permisos de este sitio (el candado junto a la dirección) y toca «Intentar de nuevo».",
  },
  fallida: {
    titulo: "No pudimos ubicarte",
    detalle:
      "Tu teléfono no encontró tu posición a tiempo. Suele pasar bajo techo o con el GPS apagado: revisa que la ubicación del teléfono esté activa e intenta de nuevo.",
  },
  no_disponible: {
    titulo: "Tu navegador no comparte ubicación",
    detalle:
      "Este navegador no permite obtener tu ubicación. Prueba desde otro navegador, como Chrome.",
  },
  sin_paradas: {
    titulo: "No hay paradas cerca de ti",
    detalle:
      "No encontramos paradas registradas a menos de 1,5 km. Es posible que aún no se haya cargado una ruta en esta zona.",
  },
};

export function EstadoSinUbicacion({ motivo }: Props) {
  const { titulo, detalle } = MENSAJES[motivo];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex size-14 items-center justify-center rounded-full border border-borde bg-fondo text-tinta-suave">
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11z" />
          <path d="M12 7.5v4" />
          <circle cx="12" cy="14" r="0.6" fill="currentColor" />
        </svg>
      </div>

      <h2 className="text-[22px] font-extrabold leading-tight tracking-tight">
        {titulo}
      </h2>
      <p className="text-sm leading-relaxed text-tinta-media">{detalle}</p>
    </div>
  );
}
