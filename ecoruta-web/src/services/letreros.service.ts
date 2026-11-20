import { crearClienteServidor } from "@/lib/supabase/server";
import { exito, fallo, falloRegistrado, type Resultado } from "./resultado";

export type Letrero = {
  id: string;
  nombre: string;
  activo: boolean;
  orden: number;
  /** Las unidades que pueden elegirlo desde la app. */
  unidadIds: string[];
};

export type DatosLetrero = {
  nombre: string;
  orden: number;
  activo: boolean;
};

type FilaLetrero = {
  id: string;
  nombre: string;
  activo: boolean;
  orden: number;
  unidad_letreros: { unidad_id: string }[];
};

/** Índice único sobre `lower(btrim(nombre))`: el nombre ya existe. */
const NOMBRE_REPETIDO = "23505";
/** Clave foránea: el letrero se borró en otra pestaña. */
const LETRERO_INEXISTENTE = "23503";

const MENSAJE_REPETIDO = "Ya existe un letrero con ese nombre.";
const MENSAJE_INEXISTENTE = "Este letrero ya no existe. Recarga la página.";

/**
 * El catálogo con las unidades de cada opción en una sola consulta: la tabla
 * cuenta cuántas lo usan y el panel lateral marca cuáles, sin otra ida a la base.
 */
export async function obtenerLetreros(): Promise<Resultado<Letrero[]>> {
  const supabase = await crearClienteServidor();

  const { data, error } = await supabase
    .from("letreros")
    .select("id, nombre, activo, orden, unidad_letreros ( unidad_id )")
    .order("orden")
    .order("nombre");

  if (error) {
    return falloRegistrado("obtener_letreros", error, "No se pudieron cargar los letreros.");
  }

  return exito((data as FilaLetrero[]).map(aLetrero));
}

export async function crearLetrero(datos: DatosLetrero): Promise<Resultado<string>> {
  const supabase = await crearClienteServidor();

  const { data, error } = await supabase.from("letreros").insert(datos).select("id").single();

  if (error?.code === NOMBRE_REPETIDO) {
    return fallo(MENSAJE_REPETIDO);
  }

  if (error) {
    return falloRegistrado("crear_letrero", error, "No se pudo crear el letrero.");
  }

  return exito(data.id);
}

/** Sirve para editar el formulario completo y para el botón de activar o desactivar. */
export async function actualizarLetrero(
  letreroId: string,
  cambios: Partial<DatosLetrero>,
): Promise<Resultado<null>> {
  const supabase = await crearClienteServidor();

  const { data, error } = await supabase
    .from("letreros")
    .update(cambios)
    .eq("id", letreroId)
    .select("id");

  if (error?.code === NOMBRE_REPETIDO) {
    return fallo(MENSAJE_REPETIDO);
  }

  if (error) {
    return falloRegistrado("actualizar_letrero", error, "No se pudieron guardar los cambios.");
  }

  if (data.length === 0) {
    return fallo(MENSAJE_INEXISTENTE);
  }

  return exito(null);
}

/**
 * Las asignaciones se van en cascada, y las unidades que lo tenían elegido quedan
 * con `letrero_id` en null (`on delete set null`): vuelven al nombre normal.
 */
export async function eliminarLetrero(letreroId: string): Promise<Resultado<null>> {
  const supabase = await crearClienteServidor();

  const { data, error } = await supabase.from("letreros").delete().eq("id", letreroId).select("id");

  if (error) {
    return falloRegistrado("eliminar_letrero", error, "No se pudo eliminar el letrero.");
  }

  if (data.length === 0) {
    return fallo(MENSAJE_INEXISTENTE);
  }

  return exito(null);
}

/**
 * Deja el letrero asignado exactamente a `unidadIds`: borra las que sobran e
 * inserta las nuevas.
 *
 * No es atómico. Se borra primero a propósito: si falla a mitad, el letrero queda
 * con MENOS unidades de las pedidas, nunca con más, y ningún conductor ve una
 * opción que el admin no quiso darle. Una unidad que lo tenía elegido y lo pierde
 * vuelve al nombre normal (`letrero_vigente`). El admin ve el error, la tabla
 * muestra lo que quedó guardado y basta con volver a guardar.
 */
export async function guardarUnidadesDelLetrero(
  letreroId: string,
  unidadIds: readonly string[],
): Promise<Resultado<null>> {
  const supabase = await crearClienteServidor();

  const actuales = await supabase
    .from("unidad_letreros")
    .select("unidad_id")
    .eq("letrero_id", letreroId);

  if (actuales.error) {
    return falloRegistrado("leer_unidades_letrero", actuales.error, "No se pudieron guardar las unidades.");
  }

  const tenia = new Set(actuales.data.map((fila) => fila.unidad_id));
  const pedidas = new Set(unidadIds);
  const sobran = [...tenia].filter((id) => !pedidas.has(id));
  const nuevas = [...pedidas].filter((id) => !tenia.has(id));

  if (sobran.length > 0) {
    const { error } = await supabase
      .from("unidad_letreros")
      .delete()
      .eq("letrero_id", letreroId)
      .in("unidad_id", sobran);

    if (error) {
      return falloRegistrado("quitar_unidades_letrero", error, "No se pudieron guardar las unidades.");
    }
  }

  if (nuevas.length > 0) {
    const { error } = await supabase
      .from("unidad_letreros")
      .insert(nuevas.map((unidadId) => ({ letrero_id: letreroId, unidad_id: unidadId })));

    if (error?.code === LETRERO_INEXISTENTE) {
      return fallo("Este letrero o alguna de las unidades ya no existe. Recarga la página.");
    }

    if (error) {
      return falloRegistrado("agregar_unidades_letrero", error, "No se pudieron guardar todas las unidades. Revisa la lista y vuelve a guardar.");
    }
  }

  return exito(null);
}

function aLetrero(fila: FilaLetrero): Letrero {
  return {
    id: fila.id,
    nombre: fila.nombre,
    activo: fila.activo,
    orden: fila.orden,
    unidadIds: fila.unidad_letreros.map((asignacion) => asignacion.unidad_id),
  };
}
