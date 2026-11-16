import { describirAntiguedad } from "@/domain/llegadas";
import type { ParadaDelRecorrido } from "@/domain/recorrido";
import { TiempoEstimado } from "@/features/seguimiento/components/ListaLlegadas";

type Props = {
  parada: ParadaDelRecorrido;
};

/**
 * Lo que el ciudadano vino a saber: cuánto le falta a la próxima unidad para
 * llegar a su parada. Usa la misma cifra que «mi parada» para que las dos
 * pantallas digan lo mismo.
 */
export function TarjetaMiParada({ parada }: Props) {
  const { proxima } = parada;

  return (
    <section
      aria-labelledby="titulo-mi-parada"
      className="flex flex-col gap-2 rounded-2xl border border-borde bg-superficie p-4"
    >
      <h2 id="titulo-mi-parada" className="text-xs font-bold text-marca-profundo">
        Tu parada · {parada.nombre}
      </h2>

      {proxima ? (
        <div className="flex items-center gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="text-[1.1875rem] font-extrabold leading-tight tracking-tight break-words">
              {proxima.unidadNombre}
            </p>
            <p className="text-xs font-semibold text-tinta-suave">Tiempo estimado a tu parada</p>
          </div>
          <TiempoEstimado estado={proxima.estado} tiempo={proxima.tiempo} grande />
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <p className="text-[1.1875rem] font-extrabold leading-tight tracking-tight">
            Sin unidades en camino
          </p>
          <p className="text-sm leading-relaxed text-tinta-media">
            Si sale una, aparece aquí sola. No hace falta recargar.
          </p>
        </div>
      )}

      {proxima?.estado.tipo === "senal_perdida" && (
        <p className="text-xs font-semibold leading-snug text-advertencia-tinta">
          {proxima.estado.segundosSinSenal === null
            ? "Inició el recorrido pero todavía no envía su posición."
            : `Última posición ${describirAntiguedad(proxima.estado.segundosSinSenal)}. Puede seguir en camino, pero no podemos confirmarlo.`}
        </p>
      )}
    </section>
  );
}
