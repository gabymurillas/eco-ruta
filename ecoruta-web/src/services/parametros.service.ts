import { valoresConRespaldo, type ValoresParametros } from "@/domain/parametros";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Parametro } from "@/types/database";
import { exito, falloRegistrado, type Resultado } from "./resultado";

export async function obtenerParametros(): Promise<Resultado<Parametro[]>> {
  const supabase = await crearClienteServidor();

  const { data, error } = await supabase
    .from("parametros")
    .select("*")
    .order("clave");

  if (error) {
    return falloRegistrado("parametros", error, "No se pudieron cargar los parámetros.");
  }

  return exito(data);
}

/**
 * Los valores que usan las pantallas para decidir (umbrales, radios, márgenes).
 * Nunca falla: si la tabla no se puede leer, cada clave cae al valor del
 * esquema. Solo la pantalla de Parámetros necesita saber que falló, y esa usa
 * `obtenerParametros`.
 */
export async function obtenerValoresDeParametros(): Promise<ValoresParametros> {
  const parametros = await obtenerParametros();
  return valoresConRespaldo(parametros.ok ? parametros.datos : []);
}

/**
 * Guarda los cambios en una sola sentencia.
 *
 * Un bucle de updates dejaría el sistema a medio calibrar si fallara en el tercero:
 * geocercas evaluándose con permanencia nueva y exactitud vieja. El upsert va en una
 * sola transacción, así que o se aplican todos o ninguno.
 *
 * La autorización la impone RLS: si la sesión no tiene rol de administración,
 * Postgres rechaza la escritura aunque la petición llegue hasta aquí.
 */
export async function guardarParametros(
  valores: ReadonlyMap<string, number>,
): Promise<Resultado<null>> {
  if (valores.size === 0) {
    return exito(null);
  }

  const supabase = await crearClienteServidor();
  const filas = [...valores].map(([clave, valor]) => ({ clave, valor }));

  // Solo se envían `clave` y `valor`: la descripción de cada parámetro no se toca.
  const { error } = await supabase
    .from("parametros")
    .upsert(filas, { onConflict: "clave" });

  if (error) {
    return falloRegistrado(
      "guardar parametros",
      error,
      "No se pudieron guardar los parámetros. No se modificó ninguno.",
    );
  }

  return exito(null);
}
