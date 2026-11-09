"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PERIODOS_DIAS } from "@/domain/incidencias";

type Props = {
  rutas: { id: string; nombre: string }[];
  rutaId: string;
  periodo: number;
};

const CLASE_SELECT =
  "h-10 rounded-[10px] border-[1.5px] border-borde-campo bg-superficie px-3 text-sm font-semibold text-tinta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo";

/** Los filtros viven en la URL: se pueden compartir y sobreviven a una recarga. */
export function FiltrosIncidencias({ rutas, rutaId, periodo }: Props) {
  const router = useRouter();
  const ruta = usePathname();
  const parametros = useSearchParams();

  function cambiar(clave: string, valor: string) {
    const nuevos = new URLSearchParams(parametros);
    if (valor) {
      nuevos.set(clave, valor);
    } else {
      nuevos.delete(clave);
    }
    // La elegida puede no pasar el filtro nuevo.
    nuevos.delete("id");
    router.replace(`${ruta}?${nuevos.toString()}`);
  }

  return (
    <div className="flex items-center gap-2.5">
      <label className="sr-only" htmlFor="filtro-ruta">Ruta</label>
      <select
        id="filtro-ruta"
        value={rutaId}
        onChange={(evento) => cambiar("ruta", evento.target.value)}
        className={CLASE_SELECT}
      >
        <option value="">Todas las rutas</option>
        {rutas.map((r) => (
          <option key={r.id} value={r.id}>{r.nombre}</option>
        ))}
      </select>

      <label className="sr-only" htmlFor="filtro-periodo">Período</label>
      <select
        id="filtro-periodo"
        value={periodo}
        onChange={(evento) => cambiar("periodo", evento.target.value)}
        className={CLASE_SELECT}
      >
        {PERIODOS_DIAS.map((dias) => (
          <option key={dias} value={dias}>Últimos {dias} días</option>
        ))}
      </select>
    </div>
  );
}
