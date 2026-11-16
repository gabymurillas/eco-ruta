import { EnlaceVerMiParada } from "./EnlaceVerMiParada";

/** Cierre de la portada: la misma acción del inicio y de dónde sale el proyecto. */
export function PiePortada() {
  return (
    <footer className="border-t border-borde bg-superficie pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-[1152px] flex-col items-start gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex flex-col gap-2">
          <p className="text-[1.1875rem] font-extrabold tracking-tight">
            ¿Ya estás en la parada?
          </p>
          <p className="max-w-[36rem] text-[0.8125rem] leading-relaxed text-tinta-media">
            EcoRuta San Juan es un proyecto de grado de Ingeniería en Informática
            de la Universidad Nacional Experimental Rómulo Gallegos (UNERG), en San
            Juan de los Morros.
          </p>
        </div>
        <EnlaceVerMiParada />
      </div>
    </footer>
  );
}
