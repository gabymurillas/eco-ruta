import { FallaDeCarga } from "@/components/ui/FallaDeCarga";
import { estadoDelTelefono, segundosDesde } from "@/domain/unidades";
import { estaVigente } from "@/domain/vinculacion";
import { SeccionUnidades } from "@/features/unidades/components/SeccionUnidades";
import { obtenerValoresDeParametros } from "@/services/parametros.service";
import { obtenerRutas } from "@/services/rutas.service";
import { obtenerUnidades, type UnidadConRuta } from "@/services/unidades.service";

export const metadata = {
  title: "Unidades · EcoRuta administración",
};

export const dynamic = "force-dynamic";

export default async function UnidadesPage() {
  const [resultado, rutas, parametros] = await Promise.all([
    obtenerUnidades(),
    obtenerRutas(),
    obtenerValoresDeParametros(),
  ]);

  if (!resultado.ok) {
    return <FallaDeCarga mensaje={resultado.error} />;
  }

  return (
    <SeccionUnidades
      unidades={conEstadoDelTelefono(resultado.datos, parametros.sin_senal_umbral_s)}
      rutas={(rutas.ok ? rutas.datos : []).map((ruta) => ({ id: ruta.id, nombre: ruta.nombre }))}
      umbralBateriaPct={parametros.bateria_alerta_pct}
    />
  );
}

/**
 * El «hace cuánto» se calcula aquí, en el servidor, una sola vez: si lo calculara
 * el cliente, el HTML del servidor y el del navegador no coincidirían.
 */
function conEstadoDelTelefono(unidades: UnidadConRuta[], umbralSinSenalS: number) {
  const ahora = new Date();

  return unidades.map((unidad) => {
    const segundosSinReporte = segundosDesde(unidad.ultimaSenalAt, ahora);
    return {
      ...unidad,
      segundosSinReporte,
      telefono: estadoDelTelefono({
        vinculado: unidad.vinculado,
        segundosSinReporte,
        codigoVigente: estaVigente(unidad.codigoExpiraAt, ahora),
        umbralSinSenalS,
      }),
    };
  });
}
