import { crearClienteServidor } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { exito, fallo, type Resultado } from "./resultado";

export type RutaConResumen = {
  id: string;
  nombre: string;
  tipo: string | null;
  icono: string | null;
  color: string;
  horario: string | null;
  activa: boolean;
  tieneTrazado: boolean;
  cantidadParadas: number;
  cantidadUnidades: number;
};

type FilaRuta = {
  id: string;
  nombre: string;
  tipo: string | null;
  icono: string | null;
  color: string;
  horario: string | null;
  activa: boolean;
  trazado: unknown;
  unidades: { count: number }[];
};

export async function obtenerRutas(): Promise<Resultado<RutaConResumen[]>> {
  const supabase = await crearClienteServidor();

  // Las paradas no tienen llave hacia la ruta: se cuentan desde la vista que
  // las calcula con el trazado, en una segunda consulta.
  const [rutas, paradasPorRuta] = await Promise.all([
    supabase
      .from("rutas")
      .select(
        `id, nombre, tipo, icono, color, horario, activa, trazado,
         unidades ( count )`,
      )
      .order("nombre"),
    supabase.from("paradas_por_ruta").select("ruta_id"),
  ]);

  if (rutas.error || paradasPorRuta.error) {
    return fallo("No se pudieron cargar las rutas.");
  }

  const data = rutas.data;
  const paradasDe = (rutaId: string) =>
    paradasPorRuta.data.filter((fila) => fila.ruta_id === rutaId).length;

  return exito(
    (data as unknown as FilaRuta[]).map((fila) => ({
      id: fila.id,
      nombre: fila.nombre,
      tipo: fila.tipo,
      icono: fila.icono,
      color: fila.color,
      horario: fila.horario,
      activa: fila.activa,
      // Sin trazado no hay tiempo estimado: la distancia no puede seguir el recorrido.
      tieneTrazado: fila.trazado !== null,
      cantidadParadas: paradasDe(fila.id),
      cantidadUnidades: fila.unidades[0]?.count ?? 0,
    })),
  );
}

type DatosRuta = {
  nombre: string;
  tipo: string | null;
  icono: string;
  color: string;
  horario: string | null;
};

export async function crearRuta(datos: DatosRuta): Promise<Resultado<string>> {
  const supabase = await crearClienteServidor();

  const { data, error } = await supabase
    .from("rutas")
    .insert(datos)
    .select("id")
    .single();

  if (error) {
    return fallo("No se pudo crear la ruta.");
  }

  return exito(data.id);
}

export async function actualizarRuta(
  id: string,
  datos: DatosRuta,
): Promise<Resultado<null>> {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("rutas").update(datos).eq("id", id);

  if (error) {
    return fallo("No se pudo guardar la ruta.");
  }

  return exito(null);
}

// ── EDICIÓN SOBRE EL MAPA ──
//
// Estas funciones viven aquí y no en `paradas.service.ts` porque ese módulo lo importa
// un hook de cliente: meterle `crearClienteServidor` arrastraría `next/headers` al
// bundle del navegador y el build fallaría. Por lo mismo, las paradas del admin
// están en `catalogo-paradas.service.ts`.

export type RutaDeMapa =
  Database["public"]["Functions"]["rutas_para_mapa"]["Returns"][number];

export type ParadaDeRuta =
  Database["public"]["Functions"]["paradas_de_ruta"]["Returns"][number];

export async function obtenerRutaDeMapa(
  id: string,
): Promise<Resultado<RutaDeMapa | null>> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("rutas_para_mapa");

  if (error) {
    return fallo("No se pudo cargar la ruta.");
  }

  return exito(data?.find((ruta) => ruta.ruta_id === id) ?? null);
}

export async function obtenerParadasDeRuta(
  id: string,
): Promise<Resultado<ParadaDeRuta[]>> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("paradas_de_ruta", { ruta: id });

  if (error) {
    return fallo("No se pudieron cargar las paradas.");
  }

  return exito(data ?? []);
}

/**
 * El trazado llega en orden GeoJSON [lng, lat]: la conversión desde Leaflet la hace
 * `domain/mapa`, y la geometría la arma PostGIS. Menos de dos puntos borra el trazado.
 */
export async function guardarTrazado(
  rutaId: string,
  coordenadas: readonly [number, number][],
): Promise<Resultado<null>> {
  const supabase = await crearClienteServidor();

  const { error } = await supabase.rpc("guardar_trazado_de_ruta", {
    ruta: rutaId,
    // Se copia porque el tipo generado del RPC espera un arreglo mutable (Json).
    coordenadas: coordenadas.map(([lng, lat]) => [lng, lat]),
  });

  if (error) {
    return fallo("No se pudo guardar el trazado.");
  }

  return exito(null);
}
