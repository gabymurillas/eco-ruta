type Props = {
  icono: string | null;
  tamano?: number;
};

/**
 * El ícono lo elige el admin al crear la ruta (rutas.icono). Como `rutas.tipo`
 * es texto libre, la interfaz no puede deducirlo: un valor desconocido o nulo
 * cae al marcador genérico en vez de romper la pantalla.
 */
export function IconoRuta({ icono, tamano = 18 }: Props) {
  const comunes = {
    width: tamano,
    height: tamano,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (icono === "camion") {
    return (
      <svg {...comunes} aria-hidden="true">
        <path d="M3 15.5V9h9v6.5" />
        <path d="M12 11h3.6l2.8 3v1.5" />
        <circle cx="7" cy="17.5" r="1.9" />
        <circle cx="16" cy="17.5" r="1.9" />
      </svg>
    );
  }

  if (icono === "cisterna") {
    return (
      <svg {...comunes} aria-hidden="true">
        <rect x="3" y="8.5" width="12" height="7" rx="3.5" />
        <path d="M15 11h2.6l2.8 3v1.5" />
        <circle cx="7" cy="17.5" r="1.9" />
        <circle cx="16" cy="17.5" r="1.9" />
      </svg>
    );
  }

  if (icono === "van") {
    return (
      <svg {...comunes} aria-hidden="true">
        <path d="M3 15.5V9.5h10l4 3h4v3" />
        <circle cx="7.5" cy="17.5" r="1.9" />
        <circle cx="16.5" cy="17.5" r="1.9" />
      </svg>
    );
  }

  if (icono === "bus") {
    return (
      <svg {...comunes} aria-hidden="true">
        <rect x="4" y="3" width="16" height="13.5" rx="3.4" />
        <path d="M4 11h16" />
        <path d="M8 16.5v2.4M16 16.5v2.4" />
      </svg>
    );
  }

  return (
    <svg {...comunes} aria-hidden="true">
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}
