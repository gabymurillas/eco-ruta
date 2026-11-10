"use client";

import { useActionState, useState, type ReactNode } from "react";
import { BOTON_PANEL_PRINCIPAL, BOTON_PANEL_SECUNDARIO } from "@/components/ui/estilos-panel";
import {
  DEFINICIONES,
  radioMinimoSugeridoM,
  validarParametros,
  type DefinicionParametro,
  type ValoresParametros,
} from "@/domain/parametros";
import { guardar, type EstadoGuardado } from "../acciones";
import { FilaParametro } from "./FilaParametro";

type Props = {
  valores: ValoresParametros;
};

type Grupo = { id: DefinicionParametro["grupo"]; titulo: string; detalle?: string; icono: ReactNode };

const GRUPOS: Record<DefinicionParametro["grupo"], Grupo> = {
  geocercas: {
    id: "geocercas",
    titulo: "Detección en las paradas",
    detalle: "Cuándo se considera que una unidad llegó o pasó",
    icono: <><path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  },
  transmision: {
    id: "transmision",
    titulo: "Transmisión y equipos",
    icono: <><rect x="7" y="3" width="10" height="18" rx="2.5" /><path d="M11 17.5h2" /></>,
  },
  tiempo: {
    id: "tiempo",
    titulo: "Tiempo estimado",
    icono: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  },
};

const ESTADO_INICIAL: EstadoGuardado = {};

export function FormularioParametros({ valores }: Props) {
  const [estado, enviar, enviando] = useActionState(guardar, ESTADO_INICIAL);
  const [textos, setTextos] = useState(() => aTextos(valores));

  // Se valida mientras se escribe: el rango ya está a la vista, no hace falta
  // esperar al servidor para decir que 3000 no cabe entre 100 y 2000.
  const erroresEnVivo = Object.fromEntries(
    validarParametros(new Map(DEFINICIONES.map(({ clave }) => [clave, aNumero(textos[clave])]))).map(
      ({ clave, mensaje }) => [clave, mensaje],
    ),
  );
  const cambiados = DEFINICIONES.filter(({ clave }) => aNumero(textos[clave]) !== valores[clave]);
  const hayErrores = Object.keys(erroresEnVivo).length > 0;

  function fila(definicion: DefinicionParametro, nota?: ReactNode) {
    const { clave } = definicion;
    return (
      <FilaParametro
        key={clave}
        definicion={definicion}
        texto={textos[clave]}
        guardado={valores[clave]}
        cambiado={cambiados.includes(definicion)}
        error={erroresEnVivo[clave] ?? estado.erroresPorClave?.[clave]}
        onCambio={(texto) => setTextos((previos) => ({ ...previos, [clave]: texto }))}
        nota={nota}
      />
    );
  }

  const exactitud = aNumero(textos.exactitud_maxima_m);
  const notaExactitud = Number.isFinite(exactitud) && (
    <p className="text-[12.5px] leading-snug text-tinta-media">
      Las paradas nuevas arrancan con un radio de{" "}
      <strong className="font-bold text-tinta">{radioMinimoSugeridoM(exactitud)} m</strong>, el doble de
      este valor: un radio menor que el error del GPS puede no detectar nunca la llegada.
    </p>
  );

  return (
    <form action={enviar} className="flex flex-col gap-4 p-6">
      <header className="flex flex-wrap items-center gap-x-3.5 gap-y-3">
        <h1 className="text-[26px] font-extrabold tracking-tight">Parámetros</h1>
        <p className="text-sm text-tinta-media">Afectan a todas las rutas y unidades a la vez</p>
        <div className="ml-auto flex items-center gap-3">
          <EstadoDelFormulario estado={estado} cambios={cambiados.length} errores={Object.keys(erroresEnVivo).length} enviando={enviando} />
          {cambiados.length > 0 && (
            <button type="button" onClick={() => setTextos(aTextos(valores))} disabled={enviando} className={BOTON_PANEL_SECUNDARIO}>
              Descartar
            </button>
          )}
          <button type="submit" disabled={enviando || hayErrores || cambiados.length === 0} className={BOTON_PANEL_PRINCIPAL}>
            {enviando ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </header>

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <Seccion grupo={GRUPOS.geocercas}>
          {porGrupo("geocercas").map((d) => fila(d, d.clave === "exactitud_maxima_m" ? notaExactitud : undefined))}
        </Seccion>
        <div className="flex flex-col gap-4">
          <Seccion grupo={GRUPOS.transmision}>{porGrupo("transmision").map((d) => fila(d))}</Seccion>
          <Seccion grupo={GRUPOS.tiempo}>{porGrupo("tiempo").map((d) => fila(d))}</Seccion>
        </div>
      </div>
    </form>
  );
}

function EstadoDelFormulario({
  estado,
  cambios,
  errores,
  enviando,
}: {
  estado: EstadoGuardado;
  cambios: number;
  errores: number;
  enviando: boolean;
}) {
  // Dice por qué «Guardar» está apagado, en vez de dejarlo deshabilitado sin más.
  if (errores > 0) {
    return (
      <span role="status" className="text-[13px] font-semibold text-error">
        {errores === 1 ? "Corrige el valor marcado para guardar" : `Corrige los ${errores} valores marcados para guardar`}
      </span>
    );
  }

  if (estado.error && !enviando) {
    return <span role="alert" className="text-[13px] font-semibold text-error">{estado.error}</span>;
  }

  return (
    <span role="status" className="text-[13px] font-semibold text-tinta-media">
      {cambios > 0
        ? `${cambios} ${cambios === 1 ? "cambio sin guardar" : "cambios sin guardar"}`
        : estado.guardadoEn && !enviando
          ? "Cambios guardados."
          : ""}
    </span>
  );
}

function Seccion({ grupo, children }: { grupo: Grupo; children: ReactNode }) {
  return (
    <section aria-labelledby={`grupo-${grupo.id}`} className="overflow-hidden rounded-2xl border border-borde bg-superficie">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-borde px-4.5 py-3">
        <span className="grid size-8 place-items-center rounded-[9px] border border-borde bg-fondo text-tinta-media">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {grupo.icono}
          </svg>
        </span>
        <h2 id={`grupo-${grupo.id}`} className="text-base font-bold">{grupo.titulo}</h2>
        {grupo.detalle && <span className="ml-auto text-[12.5px] text-tinta-media">{grupo.detalle}</span>}
      </div>
      {children}
    </section>
  );
}

function porGrupo(grupo: DefinicionParametro["grupo"]): readonly DefinicionParametro[] {
  return DEFINICIONES.filter((definicion) => definicion.grupo === grupo);
}

function aTextos(valores: ValoresParametros): Record<string, string> {
  return Object.fromEntries(DEFINICIONES.map(({ clave }) => [clave, String(valores[clave])]));
}

/** Un campo vacío no es cero: es un número que falta. */
function aNumero(texto: string | undefined): number {
  return texto === undefined || texto.trim() === "" ? Number.NaN : Number(texto);
}
