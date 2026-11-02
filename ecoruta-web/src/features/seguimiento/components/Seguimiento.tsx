"use client";

import { Boton } from "@/components/ui/Boton";
import { evaluarLlegada } from "@/domain/llegadas";
import type { LlegadaRow } from "@/services/llegadas.service";
import { useLlegadas } from "../hooks/useLlegadas";
import { useMiParada, type Fase } from "../hooks/useMiParada";
import { Bienvenida } from "./Bienvenida";
import { EstadoSinUbicacion } from "./EstadoSinUbicacion";
import { SelectorDeParada } from "./SelectorDeParada";
import { VistaParada } from "./VistaParada";

type Props = {
  umbralSinSenalS: number;
  radioAproximacionM: number;
};

export function Seguimiento({ umbralSinSenalS, radioAproximacionM }: Props) {
  const miParada = useMiParada();
  const { fase } = miParada;
  const llegadas = useLlegadas(
    fase.tipo === "parada" ? fase.parada.paradaId : null,
  );

  return (
    <div className="flex min-h-dvh flex-col bg-fondo text-tinta">
      <header className="flex items-center justify-between gap-3 px-5 pb-4 pt-14">
        <div className="flex flex-col gap-0.5">
          <span className="font-serif text-[22px] font-black tracking-tight">
            EcoRuta
          </span>
          <span className="text-xs font-semibold tracking-wide text-tinta-suave">
            San Juan de los Morros
          </span>
        </div>

        {fase.tipo === "parada" &&
          hayUnidadEnVivo(llegadas, umbralSinSenalS) && (
            <span className="flex h-9 items-center gap-2 rounded-full border-[0.5px] border-borde bg-superficie px-4">
              {/* "En vivo" es un estado, no identidad: por regla del sistema usa verde. */}
              <span
                aria-hidden="true"
                className="pulso-en-vivo size-[7px] rounded-full bg-exito"
              />
              <span className="text-[13px] font-bold">En vivo</span>
            </span>
          )}
      </header>

      <main className="flex flex-1 flex-col gap-4 rounded-t-[20px] border-t-[0.5px] border-borde bg-superficie px-5 pb-8 pt-6">
        <Contenido
          miParada={miParada}
          llegadas={llegadas}
          umbralSinSenalS={umbralSinSenalS}
          radioAproximacionM={radioAproximacionM}
        />
      </main>
    </div>
  );
}

type PropsContenido = {
  miParada: ReturnType<typeof useMiParada>;
  llegadas: readonly LlegadaRow[];
  umbralSinSenalS: number;
  radioAproximacionM: number;
};

function Contenido({
  miParada,
  llegadas,
  umbralSinSenalS,
  radioAproximacionM,
}: PropsContenido) {
  const { fase, ubicacion, cercanas, elegida } = miParada;

  // Si el ciudadano ya tiene parada, cualquier pantalla intermedia (buscar,
  // elegir, ubicación negada) le deja volver a ella.
  const volver = elegida ? miParada.cerrarSelector : null;

  switch (fase.tipo) {
    case "cargando":
      return null;

    case "bienvenida":
    case "buscando":
      return elegida ? (
        <p className="text-sm text-tinta-media">
          Buscando paradas cerca de ti…
        </p>
      ) : (
        <Bienvenida
          buscando={fase.tipo === "buscando"}
          radioAproximacionM={radioAproximacionM}
          alUsarUbicacion={miParada.pedirUbicacion}
        />
      );

    case "sin_ubicacion":
    case "sin_paradas":
    case "error":
      return <Contratiempo fase={fase} alVolver={volver} />;

    case "selector":
      return (
        <SelectorDeParada
          paradas={fase.paradas}
          elegidaId={elegida?.paradaId ?? null}
          alElegir={miParada.elegir}
          alCancelar={volver}
        />
      );

    case "parada":
      return (
        <VistaParada
          parada={fase.parada}
          otrasParadas={cercanas?.ok ? cercanas.datos : []}
          ubicacion={
            ubicacion.estado === "concedida" ? ubicacion.ubicacion : null
          }
          llegadas={llegadas}
          umbralSinSenalS={umbralSinSenalS}
          radioAproximacionM={radioAproximacionM}
          alCambiar={miParada.abrirSelector}
        />
      );
  }
}

type FaseContratiempo = Extract<
  Fase,
  { tipo: "sin_ubicacion" | "sin_paradas" | "error" }
>;

/** Lo que impide mostrar paradas. Si ya tenía una, puede volver a ella. */
function Contratiempo({
  fase,
  alVolver,
}: {
  fase: FaseContratiempo;
  alVolver: (() => void) | null;
}) {
  return (
    <>
      {fase.tipo === "error" ? (
        <p className="text-sm text-error" role="alert">
          {fase.mensaje}
        </p>
      ) : (
        <EstadoSinUbicacion
          motivo={fase.tipo === "sin_paradas" ? "sin_paradas" : fase.motivo}
        />
      )}

      {alVolver && (
        <Boton variante="fantasma" onClick={alVolver} className="self-start">
          Volver a mi parada
        </Boton>
      )}
    </>
  );
}

function hayUnidadEnVivo(
  llegadas: readonly LlegadaRow[],
  umbralSinSenalS: number,
): boolean {
  return llegadas.some(
    (llegada) =>
      evaluarLlegada({
        enViaje: llegada.viaje_id !== null,
        segundosSinSenal: llegada.segundos_sin_senal,
        umbralSinSenalS,
      }).tipo === "en_camino",
  );
}
