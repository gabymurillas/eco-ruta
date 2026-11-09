"use client";

import dynamic from "next/dynamic";
import type { PropsLienzoVistaPrevia } from "./LienzoVistaPrevia";

// Leaflet toca `window` al importarse: el lienzo queda fuera del render del servidor.
const Lienzo = dynamic(
  () => import("./LienzoVistaPrevia").then((modulo) => modulo.LienzoVistaPrevia),
  { ssr: false, loading: () => <div className="size-full bg-fondo" /> },
);

/**
 * La forma del recorrido sobre sus calles, para reconocer la ruta de un vistazo.
 * Es solo para mirar: se edita en «Editar trazado».
 */
export function VistaPreviaTrazado(props: PropsLienzoVistaPrevia) {
  return <Lienzo {...props} />;
}
