import Link from "next/link";
import type { ReactNode } from "react";
import { IconoRuta } from "@/components/ui/IconoRuta";
import { colorDeRuta, tintaSobreColorDeRuta } from "@/domain/colores";
import { describirUnidades, formatearLongitud, resumirParadas } from "@/domain/fichas-rutas";
import type { FichaRuta } from "@/services/fichas-rutas.service";
import { VistaPreviaTrazado } from "./VistaPreviaTrazado";

const CLASE_BOTON =
  "flex h-9 items-center gap-1.5 rounded-[10px] px-3.5 text-[13px] font-semibold transition-[background-color,filter] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo";
const BOTON_SECUNDARIO = `${CLASE_BOTON} border-[1.5px] border-borde-campo hover:bg-fondo`;
const BOTON_PRINCIPAL = `${CLASE_BOTON} bg-marca-profundo text-superficie hover:brightness-110`;

export function TarjetaRuta({ ruta, puedeEditar }: { ruta: FichaRuta; puedeEditar: boolean }) {
  const conTrazado = ruta.trazado.length >= 2;

  return (
    <article className="flex min-h-[260px] overflow-hidden rounded-2xl border border-borde bg-superficie">
      <div className="relative w-60 shrink-0 border-r border-borde bg-fondo">
        {conTrazado ? (
          <VistaPreviaTrazado trazado={ruta.trazado} color={ruta.color} />
        ) : (
          <SinTrazado />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4.5">
        <Encabezado ruta={ruta} />

        <div className="flex flex-wrap gap-1.5">
          <Chip tono={conTrazado ? "exito" : "advertencia"}>
            {conTrazado
              ? `Con trazado · ${formatearLongitud(ruta.longitudM)}`
              : "Sin trazado: no hay tiempo estimado"}
          </Chip>
          {!ruta.activa && <Chip tono="neutro">Inactiva: no se muestra al ciudadano</Chip>}
        </div>

        <dl className="flex gap-7">
          <Dato titulo="Paradas" valor={String(ruta.paradas.length)} />
          <Dato titulo="Unidades" valor={describirUnidades(ruta.cantidadUnidades, ruta.unidadesEnServicio)} />
        </dl>

        {conTrazado ? (
          <Recorrido paradas={ruta.paradas} color={ruta.color} />
        ) : (
          <p className="text-[13px] text-tinta-media">
            {puedeEditar
              ? "Dibuja el trazado para que la ruta pase por las paradas cercanas y los ciudadanos vean su tiempo estimado."
              : "Sin trazado la ruta no pasa por ninguna parada y los ciudadanos no ven su tiempo estimado."}
          </p>
        )}

        {puedeEditar && (
        <div className="mt-auto flex gap-2">
          <Link href={`/admin/rutas/${ruta.id}`} className={conTrazado ? BOTON_SECUNDARIO : BOTON_PRINCIPAL}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="6" cy="18" r="2.5" />
              <circle cx="18" cy="6" r="2.5" />
              <path d="M8.3 17C15 16 9 8 15.7 7" />
            </svg>
            {conTrazado ? "Editar trazado" : "Dibujar trazado"}
            <span className="sr-only"> de {ruta.nombre}</span>
          </Link>
          <Link href={`/admin/rutas/${ruta.id}/datos`} className={BOTON_SECUNDARIO}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 20h4L19 9l-4-4L4 16z" />
            </svg>
            Datos
            <span className="sr-only"> de {ruta.nombre}</span>
          </Link>
        </div>
        )}
      </div>
    </article>
  );
}

function Encabezado({ ruta }: { ruta: FichaRuta }) {
  const detalle = [ruta.tipo?.trim() || "Sin tipo", ruta.horario?.trim()].filter(Boolean).join(" · ");

  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="grid size-10 shrink-0 place-items-center rounded-[10px]"
        style={{ backgroundColor: colorDeRuta(ruta.color), color: tintaSobreColorDeRuta(ruta.color) }}
      >
        <IconoRuta icono={ruta.icono} tamano={20} />
      </span>
      <div className="flex min-w-0 flex-col">
        <h2 className="truncate text-[17px] font-bold">{ruta.nombre}</h2>
        <p className="truncate text-[13px] text-tinta-media">{detalle}</p>
      </div>
    </div>
  );
}

function Recorrido({ paradas, color }: { paradas: string[]; color: string }) {
  if (paradas.length === 0) {
    return (
      <p className="text-[13px] text-tinta-media">
        Ninguna parada queda cerca del trazado todavía.
      </p>
    );
  }

  const { visibles, restantes } = resumirParadas(paradas);

  return (
    <ol aria-label="Paradas en orden de recorrido" className="flex flex-col gap-0.5 text-[13px] font-semibold">
      {visibles.map((nombre, indice) => (
        <li key={`${indice}-${nombre}`} className="flex items-center gap-2">
          <i aria-hidden="true" className="size-3 shrink-0 rounded-full border-[3px] bg-superficie" style={{ borderColor: colorDeRuta(color) }} />
          <span className="truncate">{nombre}</span>
        </li>
      ))}
      {restantes > 0 && <li className="pl-5 font-medium text-tinta-media">… {restantes} más</li>}
    </ol>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div>
      <dt className="text-[12.5px] font-semibold text-tinta-media">{titulo}</dt>
      <dd className="text-[15px] font-bold">{valor}</dd>
    </div>
  );
}

const ICONO_POR_TONO: Record<"exito" | "advertencia" | "neutro", ReactNode> = {
  exito: <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />,
  advertencia: <path d="M12 2L23 21H1z" fill="currentColor" />,
  neutro: <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="3" />,
};

const COLOR_POR_TONO = { exito: "text-exito", advertencia: "text-advertencia", neutro: "text-tinta-media" };

/** Sobrio: fondo neutro, el color solo en el ícono, y siempre con texto. */
function Chip({ tono, children }: { tono: "exito" | "advertencia" | "neutro"; children: ReactNode }) {
  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-borde bg-fondo px-2.5 py-0.5 text-xs font-bold">
      <svg width="11" height="11" viewBox="0 0 24 24" className={COLOR_POR_TONO[tono]} aria-hidden="true">
        {ICONO_POR_TONO[tono]}
      </svg>
      {children}
    </span>
  );
}

function SinTrazado() {
  return (
    <div className="absolute inset-4 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-borde-campo bg-superficie p-4 text-center text-[13px] font-semibold text-tinta-media">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="6" cy="18" r="2.5" />
        <circle cx="18" cy="6" r="2.5" />
        <path d="M8.3 17C15 16 9 8 15.7 7" strokeDasharray="2 3" />
      </svg>
      Todavía sin trazado
    </div>
  );
}
