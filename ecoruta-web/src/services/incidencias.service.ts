import { crearClienteServidor } from "@/lib/supabase/server";
import { exito, falloRegistrado, type Resultado } from "./resultado";

const MILISEGUNDOS_POR_SEGUNDO = 1000;

export type IncidenciaActiva = {
  id: string;
  tipo: string;
  descripcion: string | null;
  segundosDesdeReporte: number;
  rutaNombre: string | null;
  rutaColor: string | null;
  unidadNombre: string | null;
};

export async function obtenerIncidenciasActivas(): Promise<Resultado<IncidenciaActiva[]>> {
  const supabase = await crearClienteServidor();

  const { data, error } = await supabase
    .from("incidencias")
    .select("id, tipo, descripcion, creada_at, rutas(nombre, color), unidades(nombre)")
    .eq("activa", true)
    .order("creada_at", { ascending: false });

  if (error) {
    return falloRegistrado(
      "incidencias activas",
      error,
      "No se pudieron cargar las incidencias.",
    );
  }

  const ahora = Date.now();

  return exito(
    (data ?? []).map((fila) => ({
      id: fila.id,
      tipo: fila.tipo,
      descripcion: fila.descripcion,
      segundosDesdeReporte: Math.max(
        0,
        Math.floor((ahora - Date.parse(fila.creada_at)) / MILISEGUNDOS_POR_SEGUNDO),
      ),
      rutaNombre: fila.rutas?.nombre ?? null,
      rutaColor: fila.rutas?.color ?? null,
      unidadNombre: fila.unidades?.nombre ?? null,
    })),
  );
}
