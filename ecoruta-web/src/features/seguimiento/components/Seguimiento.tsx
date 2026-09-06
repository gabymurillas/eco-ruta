"use client";

import { useSeguimiento } from "../hooks/useSeguimiento";
import { EstadoSinUbicacion } from "./EstadoSinUbicacion";
import { ListaRutasEnParada } from "./ListaRutasEnParada";
import { ParadaCercana } from "./ParadaCercana";

export function Seguimiento() {
  const { ubicacion, carga, error, paradaMasCercana } = useSeguimiento();

  return (
    <div className="flex min-h-dvh flex-col bg-fondo text-tinta">
      <header className="flex items-center justify-between gap-3 px-5 pb-4 pt-14">
        <div className="flex flex-col gap-[2px]">
          <span className="font-serif text-[22px] font-black leading-tight tracking-tight">
            EcoRuta
          </span>
          <span className="text-xs font-semibold tracking-wide text-tinta-suave">
            San Juan de los Morros
          </span>
        </div>

        {ubicacion.estado === "concedida" && (
          <span className="flex h-9 items-center gap-2 rounded-full border-[0.5px] border-borde bg-white px-4">
            <span className="size-[7px] rounded-full bg-marca" />
            <span className="text-[13px] font-bold">En vivo</span>
          </span>
        )}
      </header>

      <main className="flex flex-1 flex-col gap-4 rounded-t-[20px] border-t-[0.5px] border-borde bg-white px-5 pb-8 pt-6">
        {carga === "cargando" && (
          <p className="text-sm text-tinta-media">Buscando paradas cerca de ti…</p>
        )}

        {carga === "error" && (
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
              Rutas que pasan por esta parada
            </span>

            <ListaRutasEnParada rutas={paradaMasCercana.rutas} />
          </>
        )}
      </main>
    </div>
  );
}
