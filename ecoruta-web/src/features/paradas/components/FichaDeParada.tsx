"use client";

import { useState } from "react";
import { Campo } from "@/components/ui/Campo";
import { BOTON_PANEL_PRINCIPAL, BOTON_PANEL_SECUNDARIO } from "@/components/ui/estilos-panel";
import { colorDeRuta } from "@/domain/colores";
import type { useEditorDeParadas } from "../hooks/useEditorDeParadas";

type Editor = ReturnType<typeof useEditorDeParadas>;

type Props = {
  editor: Editor;
  radioMinimoM: number;
};

type PropsFicha = Props & {
  /** El operador ve los datos de la parada, sin campos ni botones de guardar. */
  soloLectura?: boolean;
};

const RADIO_MAXIMO_M = 300;
const PASO_RADIO_M = 5;
const DECIMALES_COORDENADA = 6;
const CLASE_CAMPO = "h-10 border-[1.5px] text-sm";

/**
 * La parada que se está creando o editando. Nada se guarda hasta «Guardar»:
 * mientras tanto el admin puede arrastrar el pin, tocar otro punto del mapa o
 * cambiar los datos sin que la base cambie.
 */
export function FichaDeParada({ editor, radioMinimoM, soloLectura = false }: PropsFicha) {
  const { ficha, estadoFicha } = editor;

  if (!ficha) {
    return null;
  }

  if (soloLectura) {
    return <FichaDeLectura editor={editor} />;
  }

  const nueva = ficha.paradaId === null;
  const eliminando = estadoFicha.estado === "confirmando_eliminar" || estadoFicha.estado === "eliminando";

  return (
    <section
      aria-label={nueva ? "Nueva parada" : `Editar ${ficha.nombre}`}
      className="flex flex-col gap-3 rounded-2xl border border-borde bg-superficie p-4 shadow-[0_6px_24px_rgb(0_0_0/0.14)]"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="truncate text-[19px] font-extrabold">
          {nueva ? "Nueva parada" : ficha.nombre.trim() || "Parada sin nombre"}
        </h2>
        {!nueva && !eliminando && (
          <button
            type="button"
            onClick={editor.pedirEliminar}
            disabled={editor.ocupada}
            aria-label="Eliminar parada"
            title="Eliminar parada"
            className="grid size-9 shrink-0 place-items-center rounded-[10px] border-[1.5px] border-borde-campo text-tinta-media transition-colors duration-200 ease-out hover:border-error hover:text-error focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
            </svg>
          </button>
        )}
      </div>

      <p className="-mt-1 text-[12.5px] text-tinta-media">
        Arrastra el pin o toca otro punto del mapa para moverla.
      </p>

      <Campo
        etiqueta="Nombre"
        id="nombre-parada"
        value={ficha.nombre}
        disabled={editor.ocupada}
        onChange={(evento) => editor.cambiarFicha({ nombre: evento.target.value })}
        className={CLASE_CAMPO}
      />

      <div className="grid grid-cols-2 gap-2.5">
        <CampoCoordenada etiqueta="Latitud" id="latitud-parada" valor={ficha.lat} limite={90} editor={editor} clave="lat" />
        <CampoCoordenada etiqueta="Longitud" id="longitud-parada" valor={ficha.lng} limite={180} editor={editor} clave="lng" />
      </div>

      <RadioDeGeocerca editor={editor} radioMinimoM={radioMinimoM} />

      <InterruptorAvisos editor={editor} />

      {!nueva && <RutasQuePasan rutas={editor.original?.rutas ?? []} />}

      {eliminando ? <ConfirmarEliminar editor={editor} nombre={ficha.nombre} /> : <Acciones editor={editor} nueva={nueva} />}
    </section>
  );
}

/** La misma parada, solo para mirar: datos fijos y un botón para cerrar. */
function FichaDeLectura({ editor }: { editor: Editor }) {
  const { ficha } = editor;

  if (!ficha) {
    return null;
  }

  const datos = [
    { titulo: "Latitud", valor: ficha.lat.toFixed(DECIMALES_COORDENADA) },
    { titulo: "Longitud", valor: ficha.lng.toFixed(DECIMALES_COORDENADA) },
    { titulo: "Radio de la geocerca", valor: `${ficha.radioM} m` },
    { titulo: "Avisos a los ciudadanos", valor: ficha.notifica ? "Activados" : "Apagados" },
  ];

  return (
    <section
      aria-label={ficha.nombre}
      className="flex flex-col gap-3 rounded-2xl border border-borde bg-superficie p-4 shadow-[0_6px_24px_rgb(0_0_0/0.14)]"
    >
      <h2 className="truncate text-[19px] font-extrabold">{ficha.nombre}</h2>

      <dl className="grid grid-cols-2 gap-x-2.5 gap-y-3">
        {datos.map(({ titulo, valor }) => (
          <div key={titulo}>
            <dt className="text-[12.5px] font-semibold text-tinta-media">{titulo}</dt>
            <dd className="text-sm font-bold">{valor}</dd>
          </div>
        ))}
      </dl>

      <RutasQuePasan rutas={editor.original?.rutas ?? []} />

      <div className="flex justify-end">
        <button type="button" onClick={editor.cancelar} className={BOTON_PANEL_SECUNDARIO}>
          Cerrar
        </button>
      </div>
    </section>
  );
}

type PropsCoordenada = {
  etiqueta: string;
  id: string;
  valor: number;
  limite: number;
  clave: "lat" | "lng";
  editor: Editor;
};

/**
 * Lo escrito se guarda como texto mientras no sea un número válido: así se puede
 * borrar y reescribir sin que el campo salte. Si el pin se arrastra, el campo
 * vuelve a mostrar la posición nueva.
 */
function CampoCoordenada({ etiqueta, id, valor, limite, clave, editor }: PropsCoordenada) {
  const [borrador, setBorrador] = useState<{ texto: string; valor: number } | null>(null);
  const texto = borrador && borrador.valor === valor ? borrador.texto : valor.toFixed(DECIMALES_COORDENADA);
  const invalido = borrador !== null && borrador.valor === valor && Number(borrador.texto.replace(",", ".")) !== valor;

  return (
    <Campo
      etiqueta={etiqueta}
      id={id}
      inputMode="decimal"
      value={texto}
      disabled={editor.ocupada}
      error={invalido ? "Número no válido" : undefined}
      onChange={(evento) => {
        const escrito = evento.target.value;
        const numero = Number(escrito.replace(",", "."));
        const valido = escrito.trim() !== "" && Number.isFinite(numero) && Math.abs(numero) <= limite;

        setBorrador({ texto: escrito, valor: valido ? numero : valor });
        if (valido) {
          editor.cambiarFicha({ [clave]: numero });
        }
      }}
      className={CLASE_CAMPO}
    />
  );
}

function RadioDeGeocerca({ editor, radioMinimoM }: Props) {
  const radioM = editor.ficha?.radioM ?? radioMinimoM;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="radio-geocerca" className="flex items-center justify-between text-xs font-bold tracking-wide text-tinta-suave">
        Radio de la geocerca
        <span className="text-sm font-extrabold text-tinta">{radioM} m</span>
      </label>
      <input
        id="radio-geocerca"
        type="range"
        min={radioMinimoM}
        max={RADIO_MAXIMO_M}
        step={PASO_RADIO_M}
        value={radioM}
        disabled={editor.ocupada}
        onChange={(evento) => editor.cambiarFicha({ radioM: Number(evento.target.value) })}
        aria-describedby="radio-geocerca-ayuda"
        className="accent-marca-profundo"
      />
      <p id="radio-geocerca-ayuda" className="text-[12.5px] text-tinta-media">
        Se sugiere al menos {radioMinimoM} m: el doble de la exactitud del GPS configurada. Con
        menos, la unidad podría pasar sin que el sistema la detecte.
      </p>
    </div>
  );
}

/**
 * Apagar los avisos no saca la parada del sistema: sigue registrando el paso de
 * las unidades (cuenta para la cobertura), solo deja de avisar al ciudadano.
 */
function InterruptorAvisos({ editor }: { editor: Editor }) {
  const activo = editor.ficha?.notifica ?? true;

  return (
    <div className="flex items-center justify-between gap-3 text-[13.5px]">
      <div id="avisos-parada-texto">
        <b>Avisar a los ciudadanos</b>
        <small className="block text-[12.5px] text-tinta-media">«Se acerca» y «ya pasó» para esta parada</small>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={activo}
        aria-labelledby="avisos-parada-texto"
        disabled={editor.ocupada}
        onClick={() => editor.cambiarFicha({ notifica: !activo })}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo ${
          activo ? "bg-marca-profundo" : "bg-borde-campo"
        }`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-0.5 size-5 rounded-full bg-superficie transition-[left] duration-200 ease-out ${activo ? "left-[22px]" : "left-0.5"}`}
        />
      </button>
    </div>
  );
}

function Acciones({ editor, nueva }: { editor: Editor; nueva: boolean }) {
  const { estadoFicha, problema } = editor;
  const guardando = estadoFicha.estado === "guardando";
  const fallo = estadoFicha.estado === "error";

  return (
    <div className="flex flex-col gap-2">
      {problema && <p className="text-[12.5px] font-semibold text-tinta-media">{problema}</p>}
      {fallo && (
        <p role="alert" className="text-[13px] font-semibold text-error">
          {estadoFicha.mensaje} Tus datos siguen aquí.
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={editor.cancelar} disabled={guardando} className={BOTON_PANEL_SECUNDARIO}>
          {nueva || editor.fichaConCambios ? "Cancelar" : "Cerrar"}
        </button>
        <button
          type="button"
          onClick={editor.confirmar}
          disabled={guardando || problema !== null || !editor.fichaConCambios}
          className={BOTON_PANEL_PRINCIPAL}
        >
          {guardando ? "Guardando…" : fallo ? "Reintentar" : "Guardar parada"}
        </button>
      </div>
    </div>
  );
}

function ConfirmarEliminar({ editor, nombre }: { editor: Editor; nombre: string }) {
  const { estadoFicha } = editor;
  const eliminando = estadoFicha.estado === "eliminando";
  const error = estadoFicha.estado === "confirmando_eliminar" ? estadoFicha.error : undefined;

  return (
    <div className="flex flex-col gap-2 rounded-[10px] border-[1.5px] border-error p-3">
      <p className="text-[13px] font-semibold">
        ¿Eliminar «{nombre}»? Los ciudadanos que la siguen dejarán de recibir avisos.
      </p>
      {error && (
        <p role="alert" className="text-[13px] font-semibold text-error">{error}</p>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={editor.noEliminar} disabled={eliminando} className={BOTON_PANEL_SECUNDARIO}>
          No
        </button>
        <button
          type="button"
          onClick={editor.confirmarEliminar}
          disabled={eliminando}
          className="inline-flex h-10 items-center justify-center rounded-[10px] bg-error px-4 text-sm font-semibold text-superficie transition-[filter] duration-200 ease-out hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error disabled:opacity-50"
        >
          {eliminando ? "Eliminando…" : error ? "Reintentar" : "Sí, eliminar"}
        </button>
      </div>
    </div>
  );
}

/**
 * Las rutas no se asignan aquí: salen del trazado. Si falta una, hay que
 * corregir su recorrido en el editor de la ruta o mover la parada.
 */
function RutasQuePasan({ rutas }: { rutas: Editor["paradas"][number]["rutas"] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-bold tracking-wide text-tinta-suave">Rutas que pasan</span>
      {rutas.length === 0 ? (
        <p className="text-[12.5px] text-tinta-media">
          Ninguna todavía: ningún trazado queda cerca de esta parada.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-x-3 gap-y-1">
          {rutas.map((ruta) => (
            <li key={ruta.id} className="flex items-center gap-1.5 text-[13px] font-semibold">
              <i aria-hidden="true" className="size-2.5 rounded-full" style={{ backgroundColor: colorDeRuta(ruta.color) }} />
              {ruta.nombre}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
