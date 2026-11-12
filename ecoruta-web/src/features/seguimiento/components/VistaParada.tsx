"use client";

import type { ReactNode } from "react";
import { estimarCaminataMinutos, formatearDistancia } from "@/domain/formato";
import type { LlegadaRow } from "@/services/llegadas.service";
import { useAvisoLimitaciones } from "../hooks/useAvisoLimitaciones";
import { useAvisosDeParada } from "../hooks/useAvisosDeParada";
import type { EstadoLlegadas } from "../hooks/useLlegadas";
import type { ParadaConRutas, ParadaElegida } from "../types";
import { AvisoDeParada } from "./AvisoDeParada";
import { AvisoLimitaciones } from "./AvisoLimitaciones";
import { ComoLlegar } from "./ComoLlegar";
import type { EstadoCaminata } from "../hooks/useCaminata";
import { ChipsDeRuta } from "./ChipsDeRuta";
import { useHoja } from "./HojaInferior";
import { ListaLlegadas } from "./ListaLlegadas";
import { ID_OTRAS_PARADAS, OtrasParadas } from "./OtrasParadas";

type Props = {
  parada: ParadaElegida;
  /** Las cercanas, para cambiar de parada sin salir de la vista. */
  otrasParadas: readonly ParadaConRutas[];
  llegadas: EstadoLlegadas;
  umbralSinSenalS: number;
  radioAproximacionM: number;
  penalizacionIncidenciaPct: number;
  /** Sin cercanas a mano (no compartió ubicación esta vez): abre la búsqueda. */
  alCambiar: () => void;
  alElegir: (parada: ParadaConRutas) => void;
  /** Sin ubicación no hay desde dónde trazar el camino: llega null. */
  caminata: {
    estado: EstadoCaminata;
    alPedir: () => void;
    alOcultar: () => void;
  } | null;
};

/**
 * Contenido de la hoja con la parada elegida. En orden de lectura: la parada,
 * la llegada más próxima (lo que se ve con la hoja abajo), el resto de
 * llegadas, las rutas que pasan, cambiar de parada y las limitaciones.
 */
export function VistaParada(props: Props) {
  const { parada, otrasParadas } = props;
  const llegadas = props.llegadas.llegadas ?? [];
  const { avisos, descartar } = useAvisosDeParada(parada.paradaId);
  const limitaciones = useAvisoLimitaciones();
  const hayOtras = otrasParadas.length > 1;
  const cambiar = useCambiarParada(hayOtras, props.alCambiar);

  // Un aviso a la vez: el más reciente. Al cerrarlo aparece el siguiente, si lo hay.
  const aviso = avisos.at(-1) ?? null;

  return (
    <>
      <EncabezadoParada parada={parada} alCambiar={cambiar} />

      {props.caminata && <ComoLlegar {...props.caminata} />}

      {parada.rutas.length === 0 ? (
        <p className="text-sm leading-relaxed text-tinta-media">
          Todavía no pasa ninguna ruta por esta parada. Cuando la alcaldía
          agregue una, aquí verás cuándo llega.
        </p>
      ) : (
        <ListaLlegadas
          estado={props.llegadas}
          rutas={parada.rutas}
          umbralSinSenalS={props.umbralSinSenalS}
          penalizacionIncidenciaPct={props.penalizacionIncidenciaPct}
        />
      )}

      {parada.rutas.length > 0 && (
        <Bloque titulo="Rutas que pasan aquí">
          <ChipsDeRuta rutas={parada.rutas} />
        </Bloque>
      )}

      {hayOtras && (
        <>
          <div className="h-px shrink-0 bg-borde-suave" />
          <OtrasParadas paradas={otrasParadas} elegidaId={parada.paradaId} alElegir={props.alElegir} />
        </>
      )}

      {limitaciones.visible && <AvisoLimitaciones alCerrar={limitaciones.cerrar} />}

      {aviso && (
        <AvisoDeParada
          aviso={aviso}
          parada={parada}
          {...unidadDelAviso(llegadas, aviso.unidadId, parada)}
          radioAproximacionM={props.radioAproximacionM}
          alDescartar={() => descartar(aviso.id)}
        />
      )}
    </>
  );
}

const ESPERA_SUBIDA_MS = 320;

/**
 * «Cambiar» sube la hoja hasta la lista de paradas cercanas. Si no hay
 * cercanas a mano (no compartió ubicación esta vez), abre la búsqueda.
 */
function useCambiarParada(hayOtras: boolean, alBuscar: () => void) {
  const { cambiarNivel } = useHoja();

  return () => {
    if (!hayOtras) {
      alBuscar();
      return;
    }

    cambiarNivel("alta");
    // Después de que la hoja termine de subir, para que el scroll caiga en su lugar.
    setTimeout(() => {
      document.getElementById(ID_OTRAS_PARADAS)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, ESPERA_SUBIDA_MS);
  };
}

function EncabezadoParada({ parada, alCambiar }: { parada: ParadaElegida; alCambiar: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <h2 className="text-[22px] font-extrabold leading-tight tracking-tight">{parada.nombre}</h2>
        {parada.distanciaM !== null && (
          <span className="text-[13px] font-semibold text-tinta-suave">
            A {formatearDistancia(parada.distanciaM)} ·{" "}
            {estimarCaminataMinutos(parada.distanciaM)} min a pie
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={alCambiar}
        className="-my-2 -mr-3 flex h-12 shrink-0 items-center rounded-full px-3 text-[15px] font-bold text-marca-profundo hover:bg-marca-tenue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo"
      >
        Cambiar
      </button>
    </div>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <>
      <div className="h-px shrink-0 bg-borde-suave" />
      <section className="flex flex-col gap-2.5">
        <h3 className="text-[15px] font-bold">{titulo}</h3>
        {children}
      </section>
    </>
  );
}

/**
 * La ruta sale de la unidad que generó el aviso, no de la parada: por una
 * parada pueden pasar varias rutas. Si la unidad ya no está entre las llegadas
 * y por la parada pasa una sola ruta, tiene que ser esa.
 */
function unidadDelAviso(llegadas: readonly LlegadaRow[], unidadId: string, parada: ParadaElegida) {
  const llegada = llegadas.find((fila) => fila.unidad_id === unidadId);

  if (llegada) {
    return {
      unidadNombre: llegada.unidad_nombre,
      ruta: { nombre: llegada.ruta_nombre, color: llegada.ruta_color, icono: llegada.ruta_icono },
    };
  }

  return { unidadNombre: null, ruta: parada.rutas.length === 1 ? parada.rutas[0] : null };
}
