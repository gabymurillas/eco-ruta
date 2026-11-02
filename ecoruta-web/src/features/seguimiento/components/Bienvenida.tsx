import { Boton } from "@/components/ui/Boton";
import { formatearDistancia } from "@/domain/formato";

type Props = {
  buscando: boolean;
  radioAproximacionM: number;
  alUsarUbicacion: () => void;
};

/**
 * Explica para qué se pide la ubicación antes de pedirla. El navegador muestra
 * su propio permiso apenas se toca el botón; si llega sin contexto, la mayoría
 * lo niega y ya no se puede volver a preguntar.
 */
export function Bienvenida({
  buscando,
  radioAproximacionM,
  alUsarUbicacion,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-serif text-[24px] font-black leading-tight tracking-tight">
        Encuentra tu parada
      </h1>

      <p className="text-[15px] leading-relaxed text-tinta-media">
        Comparte tu ubicación para ver qué rutas pasan cerca de ti. Te avisamos
        cuando tu unidad esté a menos de{" "}
        {formatearDistancia(radioAproximacionM)} de tu parada, y cuando ya haya
        pasado.
      </p>

      <Boton onClick={alUsarUbicacion} disabled={buscando} className="w-full">
        {buscando ? "Buscando paradas…" : "Usar mi ubicación"}
      </Boton>

      <p className="text-[13px] leading-relaxed text-tinta-suave">
        Tu ubicación solo se usa para buscar las paradas cercanas. No se guarda
        ni sale de esta búsqueda.
      </p>
    </div>
  );
}
