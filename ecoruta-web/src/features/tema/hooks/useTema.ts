"use client";

import { useCallback, useState } from "react";
import { COOKIE_TEMA, DURACION_COOKIE_TEMA_S, type Tema } from "@/domain/tema";

/**
 * Cambia el tema del panel al instante y lo recuerda.
 *
 * El atributo `data-tema` del contenedor del admin es lo que cambia los colores
 * (globals.css redefine los tokens según su valor). La cookie hace que el
 * servidor entregue el mismo tema en la próxima visita, sin parpadeo.
 */
export function useTema(temaInicial: Tema) {
  const [tema, setTema] = useState<Tema>(temaInicial);

  const elegir = useCallback((nuevo: Tema) => {
    setTema(nuevo);
    document.querySelector<HTMLElement>(".tema-admin")?.setAttribute("data-tema", nuevo);
    document.cookie = `${COOKIE_TEMA}=${nuevo}; path=/admin; max-age=${DURACION_COOKIE_TEMA_S}; samesite=lax`;
  }, []);

  return { tema, elegir };
}
