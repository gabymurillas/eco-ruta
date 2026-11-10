import { crearClienteServidor } from "@/lib/supabase/server";
import {
  calcularVencimiento,
  construirCodigo,
  LONGITUD_CODIGO,
} from "@/domain/vinculacion";
import { exito, fallo, falloRegistrado, type Resultado } from "./resultado";

export type UnidadConRuta = {
  id: string;
  nombre: string;
  activa: boolean;
  rutaId: string | null;
  rutaNombre: string | null;
  rutaColor: string | null;
  rutaIcono: string | null;
  vinculado: boolean;
  ultimaSenalAt: string | null;
  bateriaPct: number | null;
  codigoVinculacion: string | null;
  codigoExpiraAt: string | null;
};

type FilaUnidad = {
  id: string;
  nombre: string;
  activa: boolean;
  ruta_id: string | null;
  rutas: { nombre: string; color: string; icono: string | null } | null;
  dispositivos: {
    vinculado: boolean;
    ultima_senal_at: string | null;
    ultima_bateria: number | null;
    codigo_vinculacion: string | null;
    codigo_expira_at: string | null;
  } | null;
};

export async function obtenerUnidades(): Promise<Resultado<UnidadConRuta[]>> {
  const supabase = await crearClienteServidor();

  const { data, error } = await supabase
    .from("unidades")
    .select(
      `id, nombre, activa, ruta_id,
       rutas ( nombre, color, icono ),
       dispositivos ( vinculado, ultima_senal_at, ultima_bateria, codigo_vinculacion, codigo_expira_at )`,
    )
    .order("nombre");

  if (error) {
    return fallo("No se pudieron cargar las unidades.");
  }

  return exito((data as FilaUnidad[]).map(aUnidadConRuta));
}

export async function crearUnidad(
  nombre: string,
  rutaId: string | null,
): Promise<Resultado<string>> {
  const supabase = await crearClienteServidor();

  const { data, error } = await supabase
    .from("unidades")
    .insert({ nombre, ruta_id: rutaId })
    .select("id")
    .single();

  if (error) {
    return fallo("No se pudo crear la unidad.");
  }

  return exito(data.id);
}

export async function actualizarUnidad(
  unidadId: string,
  nombre: string,
  rutaId: string | null,
): Promise<Resultado<null>> {
  const supabase = await crearClienteServidor();

  const { error } = await supabase
    .from("unidades")
    .update({ nombre, ruta_id: rutaId })
    .eq("id", unidadId);

  if (error) {
    return falloRegistrado("actualizar_unidad", error, "No se pudieron guardar los cambios.");
  }

  return exito(null);
}

/**
 * Genera un código nuevo y lo deja listo para que el teléfono de la unidad lo canjee.
 *
 * Cada llamada invalida el anterior: si el admin lo pide dos veces, solo el último
 * sirve. El código vive en la tabla `dispositivos`, que RLS reserva al administrador,
 * así que nadie puede leerlo desde la web pública para robar una vinculación.
 */
export async function generarCodigoDeVinculacion(
  unidadId: string,
): Promise<Resultado<{ codigo: string; expiraEn: string }>> {
  const supabase = await crearClienteServidor();

  const bytes = new Uint8Array(LONGITUD_CODIGO);
  crypto.getRandomValues(bytes);

  const codigo = construirCodigo(bytes);
  const expiraEn = calcularVencimiento(new Date()).toISOString();

  const { error } = await supabase.from("dispositivos").upsert(
    {
      unidad_id: unidadId,
      codigo_vinculacion: codigo,
      codigo_expira_at: expiraEn,
      vinculado: false,
    },
    { onConflict: "unidad_id" },
  );

  if (error) {
    return fallo("No se pudo generar el código de vinculación.");
  }

  return exito({ codigo, expiraEn });
}

/**
 * Borra la unidad y revoca la sesión de su teléfono en la misma transacción
 * (`eliminar_unidad`, en sql/06_vinculacion.sql). Se hace en la base y no con dos
 * llamadas desde aquí porque borrar la cuenta de Auth exige privilegios que la
 * web no tiene, y porque a medias quedaría un teléfono con sesión apuntando a una
 * unidad que ya no existe.
 */
export async function eliminarUnidad(unidadId: string): Promise<Resultado<null>> {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("eliminar_unidad", { unidad: unidadId });

  if (error) {
    return falloRegistrado("eliminar_unidad", error, "No se pudo eliminar la unidad.");
  }

  return exito(null);
}

function aUnidadConRuta(fila: FilaUnidad): UnidadConRuta {
  return {
    id: fila.id,
    nombre: fila.nombre,
    activa: fila.activa,
    rutaId: fila.ruta_id,
    rutaNombre: fila.rutas?.nombre ?? null,
    rutaColor: fila.rutas?.color ?? null,
    rutaIcono: fila.rutas?.icono ?? null,
    vinculado: fila.dispositivos?.vinculado ?? false,
    ultimaSenalAt: fila.dispositivos?.ultima_senal_at ?? null,
    bateriaPct: fila.dispositivos?.ultima_bateria ?? null,
    codigoVinculacion: fila.dispositivos?.codigo_vinculacion ?? null,
    codigoExpiraAt: fila.dispositivos?.codigo_expira_at ?? null,
  };
}
