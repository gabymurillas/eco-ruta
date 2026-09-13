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

/**
 * Registra la causa real y devuelve el mensaje que verá la persona.
 *
 * Sin esto un fallo llega a la pantalla como «No se pudieron buscar las paradas» y el
 * motivo se pierde: no hay forma de distinguir una caída de la base, una clave mal
 * configurada o una política de RLS que bloquea. El detalle va al registro —consola del
 * navegador o registros de Vercel— y nunca a la interfaz: puede contener nombres de
 * tablas y columnas.
 */
export function falloRegistrado<T>(
  contexto: string,
  causa: unknown,
  mensaje: string,
): Resultado<T> {
  console.error(`[ecoruta] ${contexto}:`, causa);
  return fallo(mensaje);
}
