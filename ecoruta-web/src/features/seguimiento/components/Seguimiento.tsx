"use client";

import { useSeguimiento } from "../hooks/useSeguimiento";
import { EstadoSinUbicacion } from "./EstadoSinUbicacion";
import { ListaLlegadas } from "./ListaLlegadas";
import { ParadaCercana } from "./ParadaCercana";

type Props = {
  umbralSinSenalS: number;
};

export function Seguimiento({ umbralSinSenalS }: Props) {
  const { ubicacion, carga, error, paradaMasCercana, llegadas } = useSeguimiento({
    umbralSinSenalS,
  });

  const hayUnidadEnVivo = llegadas.some(
    (llegada) =>
      llegada.viaje_id !== null &&
      llegada.segundos_sin_senal !== null &&
      llegada.segundos_sin_senal <= umbralSinSenalS,
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

        {hayUnidadEnVivo && (
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
        {carga === "cargando" && (
          <p className="text-sm text-tinta-media">Buscando paradas cerca de ti…</p>
        )}

        {carga === "error" && error && (
          <p className="text-sm text-error" role="alert">
            {error}
          </p>
        )}

        {carga === "listo" && ubicacion.estado === "negada" && (
          <EstadoSinUbicacion motivo="negada" />
        )}

        {carga === "listo" && ubicacion.estado === "no_disponible" && (
          <EstadoSinUbicacion motivo="no_disponible" />
        )}

        {carga === "listo" &&
          ubicacion.estado === "concedida" &&
          !paradaMasCercana && <EstadoSinUbicacion motivo="sin_paradas" />}

        {carga === "listo" && paradaMasCercana && (
          <>
            <span className="text-xs font-bold tracking-wide text-tinta-suave">
              Tu parada más cercana
            </span>

            <ParadaCercana parada={paradaMasCercana} />

            <span className="pt-1 text-xs font-bold tracking-wide text-tinta-suave">
              Próximas llegadas a esta parada
            </span>

            <ListaLlegadas llegadas={llegadas} umbralSinSenalS={umbralSinSenalS} />
          </>
        )}
      </main>
    </div>
  );
}
