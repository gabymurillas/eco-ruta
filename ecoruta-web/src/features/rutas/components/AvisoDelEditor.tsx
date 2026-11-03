import type { Aviso } from "../hooks/useEditorDeRuta";

type Props = {
  aviso: Aviso | null;
  alCerrar: () => void;
};

/**
 * Confirma lo que acaba de pasar sobre el mapa, donde el admin está mirando.
 * La región `status` existe siempre: los lectores de pantalla solo anuncian
 * cambios dentro de una región que ya estaba en la página.
 */
export function AvisoDelEditor({ aviso, alCerrar }: Props) {
  return (
    <div role="status" aria-live="polite" className="pointer-events-none flex justify-center">
      {aviso && (
        <div
          key={aviso.id}
          className={`pointer-events-auto flex items-center gap-3 rounded-full border-[0.5px] bg-superficie py-1.5 pl-4 pr-1.5 text-[13px] font-bold ${
            aviso.tipo === "exito" ? "border-exito text-exito" : "border-error text-error"
          }`}
        >
          <span aria-hidden="true">{aviso.tipo === "exito" ? "✓" : "!"}</span>
          <span className="text-tinta">{aviso.texto}</span>
          <button
            type="button"
            onClick={alCerrar}
            aria-label="Cerrar aviso"
            className="flex size-8 items-center justify-center rounded-full text-tinta-suave transition-colors duration-300 ease-out hover:bg-marca-tenue focus-visible:outline-2 focus-visible:outline-marca-profundo"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
