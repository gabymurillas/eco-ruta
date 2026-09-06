/**
 * Los servicios no lanzan excepciones: devuelven un resultado tipado.
 * Así la vista siempre puede mostrar un estado de error legible en español
 * sin envolver cada llamada en try/catch.
 */
export type Resultado<T> =
  | { ok: true; datos: T }
  | { ok: false; error: string };

export function exito<T>(datos: T): Resultado<T> {
  return { ok: true, datos };
}

export function fallo<T>(error: string): Resultado<T> {
  return { ok: false, error };
}
