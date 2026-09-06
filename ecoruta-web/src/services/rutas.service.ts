import { crearClienteServidor } from "@/lib/supabase/server";
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
  paradas: { count: number }[];
  unidades: { count: number }[];
};

export async function obtenerRutas(): Promise<Resultado<RutaConResumen[]>> {
  const supabase = await crearClienteServidor();

  const { data, error } = await supabase
    .from("rutas")
    .select(
      `id, nombre, tipo, icono, color, horario, activa, trazado,
       paradas ( count ),
       unidades ( count )`,
    )
    .order("nombre");

  if (error) {
    return fallo("No se pudieron cargar las rutas.");
  }

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
      cantidadParadas: fila.paradas[0]?.count ?? 0,
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
