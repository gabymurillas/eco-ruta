"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { escucharCambiosDeFlota } from "@/services/flota-en-vivo.service";

/**
 * Las posiciones llegan en ráfagas: una por unidad cada pocos segundos. Se juntan
 * las que caen en esta ventana en un solo refresco, para no pedirle el estado al
 * servidor una vez por cada unidad.
 */
const ESPERA_PARA_AGRUPAR_MS = 2000;

/**
 * Cuando una unidad deja de transmitir no llega ningún evento, pero su estado
 * tiene que pasar a «sin señal». Esta revisión lo recoge aunque el canal esté
 * en silencio, igual que el latido de los dispositivos, que no se publica.
 */
const SEGUNDOS_ENTRE_REVISIONES = 30;

/**
 * Mantiene al día la pantalla de monitoreo sin recargarla.
 *
 * `router.refresh()` vuelve a ejecutar la página en el servidor y mezcla el
 * resultado sin desmontar los componentes de cliente: el mapa conserva el zoom y
 * la posición que eligió el gestor, y solo se mueven los marcadores.
 */
export function useMonitoreoEnVivo() {
  const router = useRouter();
  const [conectado, setConectado] = useState(false);

  useEffect(() => {
    let refrescoPendiente: ReturnType<typeof setTimeout> | null = null;

    const refrescarPronto = () => {
      refrescoPendiente ??= setTimeout(() => {
        refrescoPendiente = null;
        router.refresh();
      }, ESPERA_PARA_AGRUPAR_MS);
    };

    const dejarDeEscuchar = escucharCambiosDeFlota({
      alCambiar: refrescarPronto,
      alCambiarConexion: setConectado,
    });
    const revision = setInterval(() => router.refresh(), SEGUNDOS_ENTRE_REVISIONES * 1000);

    return () => {
      dejarDeEscuchar();
      clearInterval(revision);

      if (refrescoPendiente) {
        clearTimeout(refrescoPendiente);
      }
    };
  }, [router]);

  return { conectado };
}
