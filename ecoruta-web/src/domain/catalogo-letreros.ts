/**
 * Reglas del catálogo de letreros (sql/21). Repiten los `check` de la tabla para
 * que el admin lea un error claro antes de que la base lo rechace.
 */

/** El mismo límite que `letreros.nombre` en la base: cabe en el selector de la app. */
export const LARGO_MAXIMO_NOMBRE_LETRERO = 60;

/** `orden` es `integer` en PostgreSQL: más allá, la base rechaza el valor. */
const ORDEN_MAXIMO = 2_147_483_647;

export type ValidacionLetrero =
  | { ok: true; nombre: string; orden: number }
  | { ok: false; error: string };

export function validarLetrero(nombreCrudo: string, ordenCrudo: string): ValidacionLetrero {
  const nombre = nombreCrudo.trim();

  if (!nombre) {
    return { ok: false, error: "Escribe el nombre del letrero." };
  }

  if (nombre.length > LARGO_MAXIMO_NOMBRE_LETRERO) {
    return {
      ok: false,
      error: `El nombre no puede pasar de ${LARGO_MAXIMO_NOMBRE_LETRERO} caracteres.`,
    };
  }

  const orden = leerOrden(ordenCrudo);

  if (orden === null) {
    return { ok: false, error: "El orden debe ser un número entero, 0 o mayor." };
  }

  return { ok: true, nombre, orden };
}

/** Vacío vale 0, como el valor por defecto de la columna. */
function leerOrden(texto: string): number | null {
  const limpio = texto.trim();

  if (!limpio) {
    return 0;
  }

  if (!/^\d+$/.test(limpio)) {
    return null;
  }

  const orden = Number(limpio);
  return orden <= ORDEN_MAXIMO ? orden : null;
}
