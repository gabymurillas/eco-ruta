"use client";

import { useSyncExternalStore } from "react";
import { leerMiParada } from "@/services/preferencias.service";

const sinSuscripcion = () => () => {};

/**
 * La parada que el ciudadano eligió en el mapa, para marcarla en el recorrido.
 *
 * localStorage solo existe en el navegador: en el servidor vale null y el
 * navegador la completa al hidratar, sin el desajuste que daría leerla al
 * renderizar. Solo se lee: elegirla sigue siendo cosa de «mi parada».
 */
export function useMiParadaGuardada(): string | null {
  return useSyncExternalStore(
    sinSuscripcion,
    () => leerMiParada()?.paradaId ?? null,
    () => null,
  );
}
