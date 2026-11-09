import { crearClienteServidor } from "@/lib/supabase/server";
import { leerLineaEwkb } from "@/domain/ewkb";
import type { Punto } from "@/domain/mapa";
import { longitudM } from "@/domain/trazado";
import { exito, falloRegistrado, type Resultado } from "./resultado";

export type FichaRuta = {
  id: string;
  nombre: string;
  tipo: string | null;
  icono: string | null;
  color: string;
  horario: string | null;
  activa: boolean;
  /** Vacío cuando la ruta todavía no tiene trazado. */
  trazado: Punto[];
  longitudM: number;
  /** En el orden en que la ruta pasa por ellas. */
  paradas: string[];
  cantidadUnidades: number;
  unidadesEnServicio: number;
};

/**
 * Lo que muestra cada tarjeta de la sección Rutas. Va aparte de `obtenerRutas`
 * porque trae el trazado completo y los nombres de las paradas, que los
 * selectores de ruta de otras pantallas no necesitan.
 *
 * Son cuatro consultas en paralelo y el cruce se hace aquí: las paradas no
 * tienen llave hacia la ruta (las calcula `paradas_por_ruta` con el trazado).
 */
export async function obtenerFichasDeRutas(): Promise<Resultado<FichaRuta[]>> {
  const supabase = await crearClienteServidor();

  const [rutas, paradasPorRuta, paradas, viajesAbiertos] = await Promise.all([
    supabase
      .from("rutas")
      .select("id, nombre, tipo, icono, color, horario, activa, trazado, unidades ( count )")
      .order("nombre"),
    supabase.from("paradas_por_ruta").select("ruta_id, parada_id, avance"),
    supabase.from("paradas").select("id, nombre"),
    // Un viaje sin cierre es una unidad recorriendo la ruta ahora mismo.
    supabase.from("viajes").select("ruta_id").is("finalizado_at", null),
  ]);

  const error = rutas.error ?? paradasPorRuta.error ?? paradas.error ?? viajesAbiertos.error;
  if (error) {
    return falloRegistrado("fichas de rutas", error, "No se pudieron cargar las rutas.");
  }

  const nombreDeParada = new Map((paradas.data ?? []).map((p) => [p.id, p.nombre]));

  return exito(
    (rutas.data ?? []).map((fila) => {
      const trazado = leerLineaEwkb(fila.trazado) ?? [];
      const paradasDeLaRuta = (paradasPorRuta.data ?? [])
        .filter((p) => p.ruta_id === fila.id)
        .sort((a, b) => (a.avance ?? 0) - (b.avance ?? 0))
        .map((p) => nombreDeParada.get(p.parada_id ?? "") ?? "Parada sin nombre");

      return {
        id: fila.id,
        nombre: fila.nombre,
        tipo: fila.tipo,
        icono: fila.icono,
        color: fila.color,
        horario: fila.horario,
        activa: fila.activa,
        trazado,
        longitudM: longitudM(trazado),
        paradas: paradasDeLaRuta,
        cantidadUnidades: fila.unidades[0]?.count ?? 0,
        unidadesEnServicio: (viajesAbiertos.data ?? []).filter((v) => v.ruta_id === fila.id).length,
      };
    }),
  );
}
