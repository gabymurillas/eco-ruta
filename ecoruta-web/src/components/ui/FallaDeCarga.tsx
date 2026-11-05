"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Boton } from "./Boton";

type Props = {
  /** Qué no se pudo cargar, tal como lo devuelve el servicio. */
  mensaje: string;
};

/**
 * Una página del panel que no pudo leer sus datos.
 *
 * El reintento vuelve a pedir los datos al servidor (`router.refresh`) sin
 * recargar el navegador: el operador no pierde el menú ni la sesión, y casi
 * siempre la causa es una conexión que se cortó un momento.
 */
export function FallaDeCarga({ mensaje }: Props) {
  const router = useRouter();
  const [reintentando, iniciar] = useTransition();

  return (
    <main className="flex flex-1 items-center justify-center p-7">
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <p role="alert" className="font-serif text-lg font-bold text-error">
          {mensaje}
        </p>
        <p className="text-sm text-tinta-media">
          Suele ser la conexión. Si vuelve a fallar, espera un minuto e intenta de
          nuevo.
        </p>
        <Boton onClick={() => iniciar(() => router.refresh())} disabled={reintentando}>
          {reintentando ? "Intentando…" : "Intentar de nuevo"}
        </Boton>
      </div>
    </main>
  );
}
