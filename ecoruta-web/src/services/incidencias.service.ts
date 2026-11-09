import { crearClienteServidor } from "@/lib/supabase/server";
import { leerPuntoEwkb } from "@/domain/ewkb";
import { exito, fallo, falloRegistrado, type Resultado } from "./resultado";

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

export type Incidencia = {
  id: string;
  tipo: string;
  descripcion: string | null;
  activa: boolean;
  creadaAt: string;
  resueltaAt: string | null;
  segundosDesdeReporte: number;
  rutaId: string;
  rutaNombre: string | null;
  rutaColor: string | null;
  unidadNombre: string | null;
  ubicacion: { lat: number; lng: number } | null;
};

/**
 * Incidencias para la sección del panel: las activas siempre, sin importar cuándo
 * se reportaron (siguen afectando el tiempo estimado), y las resueltas del período.
 */
export async function obtenerIncidencias(periodoDias: number): Promise<Resultado<Incidencia[]>> {
  const supabase = await crearClienteServidor();
  const desde = new Date(Date.now() - periodoDias * 86_400_000).toISOString();

  const { data, error } = await supabase
    .from("incidencias")
    .select(
      "id, tipo, descripcion, activa, creada_at, resuelta_at, ruta_id, ubicacion, rutas(nombre, color), unidades(nombre)",
    )
    .or(`activa.eq.true,creada_at.gte.${desde}`)
    .order("creada_at", { ascending: false })
    .limit(500);

  if (error) {
    return falloRegistrado("incidencias del panel", error, "No se pudieron cargar las incidencias.");
  }

  const ahora = Date.now();

  return exito(
    (data ?? []).map((fila) => ({
      id: fila.id,
      tipo: fila.tipo,
      descripcion: fila.descripcion,
      activa: fila.activa,
      creadaAt: fila.creada_at,
      resueltaAt: fila.resuelta_at,
      segundosDesdeReporte: Math.max(
        0,
        Math.floor((ahora - Date.parse(fila.creada_at)) / MILISEGUNDOS_POR_SEGUNDO),
      ),
      rutaId: fila.ruta_id,
      rutaNombre: fila.rutas?.nombre ?? null,
      rutaColor: fila.rutas?.color ?? null,
      unidadNombre: fila.unidades?.nombre ?? null,
      ubicacion: leerPuntoEwkb(fila.ubicacion),
    })),
  );
}

/**
 * Cierra una incidencia: deja de sumar margen al tiempo estimado y de mostrarse
 * al ciudadano. Solo toca filas activas, así que dos gestores que la cierran a la
 * vez no pisan la hora del primero.
 */
export async function resolverIncidencia(id: string): Promise<Resultado<null>> {
  const supabase = await crearClienteServidor();

  const { data, error } = await supabase
    .from("incidencias")
    .update({ activa: false, resuelta_at: new Date().toISOString() })
    .eq("id", id)
    .eq("activa", true)
    .select("id");

  if (error) {
    return falloRegistrado("resolver incidencia", error, "No se pudo marcar como resuelta.");
  }

  if (!data || data.length === 0) {
    return fallo("Esta incidencia ya estaba resuelta o fue eliminada.");
  }

  return exito(null);
}
