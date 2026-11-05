type Props = {
  /** Texto debajo del nombre, por ejemplo «Panel de gestión». */
  subtitulo?: string;
  className?: string;
};

/**
 * Marca del panel: el trazo de una ruta entre dos paradas sobre el amarillo de
 * la identidad del admin. El amarillo es solo de marca: nunca es estado ni ruta.
 */
export function LogoAdmin({ subtitulo, className = "" }: Props) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sol text-noche">
        <svg
          width="21"
          height="21"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="6" cy="18" r="2.5" />
          <circle cx="18" cy="6" r="2.5" />
          <path d="M8.3 17C15 16 9 8 15.7 7" />
        </svg>
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[17px] font-extrabold">EcoRuta San Juan</span>
        {subtitulo && <span className="text-[13px] font-medium opacity-80">{subtitulo}</span>}
      </span>
    </div>
  );
}
