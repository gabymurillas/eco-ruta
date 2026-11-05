"use client";

import { Boton } from "@/components/ui/Boton";
import { evaluarLlegada } from "@/domain/llegadas";
import { useLlegadas, type EstadoLlegadas } from "../hooks/useLlegadas";
import { useMiParada, type Fase } from "../hooks/useMiParada";
import type { ParadaConRutas } from "../types";
import { Bienvenida } from "./Bienvenida";
import { EstadoSinUbicacion } from "./EstadoSinUbicacion";
import { ParadaMasLejos } from "./ParadaMasLejos";
import { SelectorDeParada } from "./SelectorDeParada";
import { VistaParada } from "./VistaParada";

type Props = {
  umbralSinSenalS: number;
  radioAproximacionM: number;
  penalizacionIncidenciaPct: number;
};

export function Seguimiento({
  umbralSinSenalS,
  radioAproximacionM,
  penalizacionIncidenciaPct,
}: Props) {
  const miParada = useMiParada();
  const { fase } = miParada;
  const llegadas = useLlegadas(
    fase.tipo === "parada" ? fase.parada.paradaId : null,
  );

  // En escritorio la columna se queda del ancho de un teléfono grande: estirada,
  // la lista de llegadas y el mapa pierden la lectura de un vistazo.
  return (
    <div className="flex min-h-dvh flex-col bg-fondo text-tinta">
      <header className="mx-auto flex w-full max-w-xl items-center justify-between gap-3 px-5 pb-4 pt-14">
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

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 rounded-t-[20px] border-t-[0.5px] sm:border-x-[0.5px] border-borde bg-superficie px-5 pb-8 pt-6">
        <Contenido
          miParada={miParada}
          llegadas={llegadas}
          umbralSinSenalS={umbralSinSenalS}
          radioAproximacionM={radioAproximacionM}
          penalizacionIncidenciaPct={penalizacionIncidenciaPct}
        />
      </main>
    </div>
  );
}

type PropsContenido = {
  miParada: ReturnType<typeof useMiParada>;
  llegadas: EstadoLlegadas;
  umbralSinSenalS: number;
  radioAproximacionM: number;
  penalizacionIncidenciaPct: number;
};

function Contenido({
  miParada,
  llegadas,
  umbralSinSenalS,
  radioAproximacionM,
  penalizacionIncidenciaPct,
}: PropsContenido) {
  const { fase, ubicacion, cercanas, elegida } = miParada;

  // Si el ciudadano ya tiene parada, cualquier pantalla intermedia (buscar,
  // elegir, ubicación negada) le deja volver a ella.
  const volver = elegida ? miParada.cerrarSelector : null;

  switch (fase.tipo) {
    // Es lo que llega en el HTML del servidor: con mala señal se ve hasta que
    // termina de bajar el JavaScript, así que no puede ser una hoja en blanco.
    case "cargando":
      return (
        <p className="text-sm text-tinta-media" role="status">
          Cargando tu parada…
        </p>
      );

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
      return (
        <Contratiempo
          fase={fase}
          alVolver={volver}
          alElegir={miParada.elegir}
          alReintentar={miParada.pedirUbicacion}
        />
      );

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
          penalizacionIncidenciaPct={penalizacionIncidenciaPct}
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
  alElegir,
  alReintentar,
}: {
  fase: FaseContratiempo;
  alVolver: (() => void) | null;
  alElegir: (parada: ParadaConRutas) => void;
  alReintentar: () => void;
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

      {fase.tipo === "sin_paradas" && fase.masCercana && (
        <ParadaMasLejos parada={fase.masCercana} alElegir={alElegir} />
      )}

      {puedeReintentar(fase) && (
        <Boton onClick={alReintentar} className="self-start">
          Intentar de nuevo
        </Boton>
      )}

      {alVolver && (
        <Boton variante="fantasma" onClick={alVolver} className="self-start">
          Volver a mi parada
        </Boton>
      )}
    </>
  );
}

/**
 * Reintentar sirve cuando falló la búsqueda o el GPS, y también con el permiso
 * negado: si el ciudadano lo activó en los ajustes, vuelve a funcionar sin
 * recargar. Un navegador sin geolocalización no cambia por insistir.
 */
function puedeReintentar(fase: FaseContratiempo): boolean {
  return (
    fase.tipo === "error" ||
    (fase.tipo === "sin_ubicacion" && fase.motivo !== "no_disponible")
  );
}

/** Con el último refresco fallido no se puede afirmar «en vivo». */
function hayUnidadEnVivo(
  { llegadas, falla }: EstadoLlegadas,
  umbralSinSenalS: number,
): boolean {
  if (falla || !llegadas) {
    return false;
  }

  return llegadas.some(
    (llegada) =>
      evaluarLlegada({
        enViaje: llegada.viaje_id !== null,
        segundosSinSenal: llegada.segundos_sin_senal,
        umbralSinSenalS,
      }).tipo === "en_camino",
  );
}
