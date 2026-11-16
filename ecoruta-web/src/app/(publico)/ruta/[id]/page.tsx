import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { FallaDeCarga } from "@/components/ui/FallaDeCarga";
import { DetalleRuta } from "@/features/recorrido/components/DetalleRuta";
import { obtenerValoresDeParametros } from "@/services/parametros.service";
import { obtenerRutaPublica } from "@/services/rutas.service";

export const dynamic = "force-dynamic";

/** La metadata y la página leen la misma ruta: una sola consulta por visita. */
const leerRuta = cache(obtenerRutaPublica);

export async function generateMetadata({ params }: PageProps<"/ruta/[id]">): Promise<Metadata> {
  const { id } = await params;
  const ruta = await leerRuta(id);
  const nombre = ruta.ok && ruta.datos ? ruta.datos.nombre : "Ruta";

  return {
    title: `${nombre} · EcoRuta San Juan`,
    description: `Las paradas de ${nombre} en orden y el tiempo estimado de su próxima unidad, en San Juan de los Morros.`,
  };
}

/** Detalle de una ruta para el ciudadano (CIU-16). Solo compone. */
export default async function RutaPage({ params }: PageProps<"/ruta/[id]">) {
  const { id } = await params;
  const [ruta, parametros] = await Promise.all([leerRuta(id), obtenerValoresDeParametros()]);

  if (!ruta.ok) {
    return (
      <div className="tema-ciudadano flex min-h-dvh flex-col bg-fondo text-tinta">
        <FallaDeCarga mensaje={ruta.error} />
      </div>
    );
  }

  if (!ruta.datos) {
    notFound();
  }

  return (
    <DetalleRuta
      ruta={ruta.datos}
      umbralSinSenalS={parametros.sin_senal_umbral_s}
      penalizacionIncidenciaPct={parametros.penalizacion_incidencia_pct}
    />
  );
}
