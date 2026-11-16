"use client";

import dynamic from "next/dynamic";
import type { Recorrido } from "@/domain/recorrido";
import { EnlaceVerMiParada } from "@/features/portada/components/EnlaceVerMiParada";
import { useTrazados } from "@/features/seguimiento/hooks/useTrazados";
import { useMiParadaGuardada } from "../hooks/useMiParadaGuardada";
import { useRecorrido } from "../hooks/useRecorrido";
import { AvisoIncidencia } from "./AvisoIncidencia";
import { CabeceraRuta } from "./CabeceraRuta";
import { ListaParadas } from "./ListaParadas";
import { TarjetaMiParada } from "./TarjetaMiParada";

/**
 * Leaflet toca `window` al importarse: el mapa queda fuera del render del
 * servidor, como en el seguimiento.
 */
const MapaRecorrido = dynamic(
  () => import("./MapaRecorrido").then((modulo) => modulo.MapaRecorrido),
  {
    ssr: false,
    loading: () => (
      <div className="flex size-full items-start justify-center bg-fondo pt-10">
        <p className="text-sm text-tinta-media">Cargando el mapa…</p>
      </div>
    ),
  },
);

export type RutaDelDetalle = {
  id: string;
  nombre: string;
  tipo: string | null;
  icono: string | null;
  color: string;
  horario: string | null;
};

type Props = {
  ruta: RutaDelDetalle;
  umbralSinSenalS: number;
  penalizacionIncidenciaPct: number;
};

/**
 * El recorrido de una ruta: mapa arriba (a la izquierda en escritorio) y, debajo,
 * la próxima unidad a la parada del ciudadano y las paradas en orden. A
 * diferencia del seguimiento, la página tiene scroll normal: se lee de arriba
 * abajo.
 */
export function DetalleRuta({ ruta, ...ajustes }: Props) {
  const { recorrido, falla } = useRecorrido(ruta.id, ajustes);
  const trazados = useTrazados([ruta.id]);
  const miParadaId = useMiParadaGuardada();
  const enVivo = !falla && (recorrido?.unidades.some((unidad) => unidad.estado.tipo === "en_camino") ?? false);

  return (
    <div className="tema-ciudadano flex min-h-dvh flex-col bg-fondo text-tinta">
      <CabeceraRuta ruta={ruta} enVivo={enVivo} />

      <main className="mx-auto w-full max-w-[1152px] flex-1 lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-6 lg:px-6 lg:py-6">
        <section
          aria-label={`Mapa del recorrido de ${ruta.nombre}`}
          className="h-[40vh] min-h-64 border-b border-borde lg:sticky lg:top-6 lg:h-[calc(100dvh-8.5rem)] lg:overflow-hidden lg:rounded-2xl lg:border"
        >
          <MapaRecorrido
            ruta={ruta}
            trazado={trazados[0]?.puntos ?? []}
            paradas={recorrido?.paradas ?? []}
            unidades={recorrido?.unidades ?? []}
            miParadaId={miParadaId}
          />
        </section>

        <div className="flex flex-col gap-5 px-4 py-5 lg:px-0 lg:py-0">
          <Contenido
            recorrido={recorrido}
            falla={falla}
            miParadaId={miParadaId}
            ruta={ruta}
            penalizacionIncidenciaPct={ajustes.penalizacionIncidenciaPct}
          />

          <div className="h-px shrink-0 bg-borde-suave" />
          <EnlaceVerMiParada className="self-start" />
        </div>
      </main>
    </div>
  );
}

type PropsContenido = {
  recorrido: Recorrido | null;
  falla: string | null;
  miParadaId: string | null;
  ruta: RutaDelDetalle;
  penalizacionIncidenciaPct: number;
};

function Contenido({ recorrido, falla, miParadaId, ruta, penalizacionIncidenciaPct }: PropsContenido) {
  // Es lo que llega en el HTML del servidor: no puede ser una hoja en blanco.
  if (recorrido === null) {
    return falla ? (
      <p className="text-sm leading-relaxed text-error" role="alert">
        {falla} Lo volvemos a intentar solo en unos segundos; revisa tu conexión.
      </p>
    ) : (
      <p className="text-sm text-tinta-media" role="status">
        Cargando el recorrido…
      </p>
    );
  }

  if (recorrido.paradas.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-tinta-media">
        Esta ruta todavía no tiene su recorrido cargado: falta su trazado o sus
        paradas. Cuando la alcaldía lo complete, aquí verás sus paradas en orden.
      </p>
    );
  }

  const miParada = recorrido.paradas.find((parada) => parada.paradaId === miParadaId) ?? null;

  return (
    <>
      {falla && (
        <p className="text-xs font-semibold text-advertencia-tinta" role="status">
          No pudimos actualizar. Lo que ves puede estar atrasado; seguimos
          intentando.
        </p>
      )}

      {recorrido.incidenciaActiva && (
        <AvisoIncidencia penalizacionIncidenciaPct={penalizacionIncidenciaPct} />
      )}

      {miParada && <TarjetaMiParada parada={miParada} />}

      <ListaParadas
        paradas={recorrido.paradas}
        miParadaId={miParadaId}
        color={ruta.color}
        horario={ruta.horario}
      />
    </>
  );
}
