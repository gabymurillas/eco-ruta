"use client";

import dynamic from "next/dynamic";
import { evaluarLlegada } from "@/domain/llegadas";
import type { LlegadaRow } from "@/services/llegadas.service";
import { useAvisoLimitaciones } from "../hooks/useAvisoLimitaciones";
import { useAvisosDeParada } from "../hooks/useAvisosDeParada";
import type { ParadaConRutas, ParadaElegida, Ubicacion } from "../types";
import { AvisoDeParada } from "./AvisoDeParada";
import { AvisoLimitaciones } from "./AvisoLimitaciones";
import { ListaLlegadas } from "./ListaLlegadas";
import { ParadaCercana } from "./ParadaCercana";

/**
 * Leaflet toca `window` al importarse, asi que el lienzo queda fuera del render del
 * servidor. En Next 16 `ssr: false` solo se permite dentro de un componente cliente,
 * y este lo es.
 */
const LienzoSeguimiento = dynamic(
  () =>
    import("./LienzoSeguimiento").then((modulo) => modulo.LienzoSeguimiento),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-56 items-center justify-center rounded-2xl border-[0.5px] border-borde bg-fondo">
        <p className="text-sm text-tinta-media">Cargando el mapa…</p>
      </div>
    ),
  },
);

type Props = {
  parada: ParadaElegida;
  /** Las de alrededor se dibujan en el mapa para que el ciudadano se ubique. */
  otrasParadas: readonly ParadaConRutas[];
  ubicacion: Ubicacion | null;
  llegadas: readonly LlegadaRow[];
  umbralSinSenalS: number;
  radioAproximacionM: number;
  alCambiar: () => void;
};

export function VistaParada(props: Props) {
  const { parada, llegadas, umbralSinSenalS, alCambiar } = props;
  const { avisos, descartar } = useAvisosDeParada(parada.paradaId);
  const limitaciones = useAvisoLimitaciones();

  // Un aviso a la vez: el más reciente. Al cerrarlo aparece el siguiente, si lo hay.
  const aviso = avisos.at(-1) ?? null;

  return (
    <>
      <span className="text-xs font-bold tracking-wide text-tinta-suave">
        Tu parada
      </span>

      <ParadaCercana parada={parada} alCambiar={alCambiar} />

      {limitaciones.visible && (
        <AvisoLimitaciones alCerrar={limitaciones.cerrar} />
      )}

      <div className="h-56 overflow-hidden rounded-2xl border-[0.5px] border-borde">
        <LienzoSeguimiento
          ubicacion={props.ubicacion}
          paradas={paradasDelMapa(parada, props.otrasParadas)}
          unidades={unidadesDelMapa(llegadas, umbralSinSenalS)}
        />
      </div>

      <span className="pt-1 text-xs font-bold tracking-wide text-tinta-suave">
        Próximas llegadas a esta parada
      </span>

      {parada.rutas.length === 0 ? (
        <p className="text-sm leading-relaxed text-tinta-media">
          Todavía no pasa ninguna ruta por esta parada. Cuando la alcaldía
          agregue una, aquí verás cuándo llega.
        </p>
      ) : (
        <ListaLlegadas llegadas={llegadas} umbralSinSenalS={umbralSinSenalS} />
      )}

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

/**
 * La ruta sale de la unidad que generó el aviso, no de la parada: por una
 * parada pueden pasar varias rutas. Si la unidad ya no está entre las llegadas
 * y por la parada pasa una sola ruta, tiene que ser esa.
 */
function unidadDelAviso(
  llegadas: readonly LlegadaRow[],
  unidadId: string,
  parada: ParadaElegida,
) {
  const llegada = llegadas.find((fila) => fila.unidad_id === unidadId);

  if (llegada) {
    return {
      unidadNombre: llegada.unidad_nombre,
      ruta: { nombre: llegada.ruta_nombre, color: llegada.ruta_color, icono: llegada.ruta_icono },
    };
  }

  return { unidadNombre: null, ruta: parada.rutas.length === 1 ? parada.rutas[0] : null };
}

function paradasDelMapa(
  parada: ParadaElegida,
  otras: readonly ParadaConRutas[],
) {
  return [
    parada,
    ...otras.filter((otra) => otra.paradaId !== parada.paradaId),
  ].map((actual) => ({
    id: actual.paradaId,
    nombre: actual.nombre,
    lat: actual.lat,
    lng: actual.lng,
    color: actual.rutas[0]?.color ?? null,
    destacada: actual.paradaId === parada.paradaId,
  }));
}

function unidadesDelMapa(
  llegadas: readonly LlegadaRow[],
  umbralSinSenalS: number,
) {
  return llegadas.flatMap((llegada) =>
    llegada.unidad_lat === null || llegada.unidad_lng === null
      ? []
      : [
          {
            id: llegada.unidad_id,
            nombre: llegada.unidad_nombre,
            lat: llegada.unidad_lat,
            lng: llegada.unidad_lng,
            rutaNombre: llegada.ruta_nombre,
            color: llegada.ruta_color,
            icono: llegada.ruta_icono,
            transmitiendo: estaTransmitiendo(llegada, umbralSinSenalS),
          },
        ],
  );
}

function estaTransmitiendo(
  llegada: LlegadaRow,
  umbralSinSenalS: number,
): boolean {
  const estado = evaluarLlegada({
    enViaje: llegada.viaje_id !== null,
    segundosSinSenal: llegada.segundos_sin_senal,
    umbralSinSenalS,
  });

  return estado.tipo === "en_camino";
}
