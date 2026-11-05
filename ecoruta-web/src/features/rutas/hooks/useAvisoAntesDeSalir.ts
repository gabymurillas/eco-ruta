"use client";

import { useEffect } from "react";

/**
 * Pide confirmación al cerrar o recargar la pestaña con cambios sin guardar.
 * Un trazado se arma punto por punto: perderlo por un F5 cuesta media hora.
 *
 * Solo cubre lo que pasa por el navegador (cerrar, recargar, escribir otra
 * dirección). La navegación interna de Next no dispara `beforeunload`.
 */
export function useAvisoAntesDeSalir(hayCambios: boolean) {
  useEffect(() => {
    if (!hayCambios) {
      return;
    }

    const avisar = (evento: BeforeUnloadEvent) => {
      evento.preventDefault();
    };

    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [hayCambios]);
}
