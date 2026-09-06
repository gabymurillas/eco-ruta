/**
 * Código de vinculación del dispositivo.
 *
 * Lo escribe una persona en el teléfono de la unidad, casi siempre dentro del vehículo
 * y a contraluz. Por eso el alfabeto excluye los caracteres que se confunden al leer:
 * 0/O, 1/I/L y el 5/S. Un código mal tecleado es una visita perdida al vehículo.
 */

const ALFABETO = "2346789ABCDEFGHJKMNPQRTUVWXYZ";

export const LONGITUD_CODIGO = 5;
export const VIGENCIA_MINUTOS = 10;

/**
 * Recibe los bytes aleatorios en vez de generarlos: así la función es pura y se puede
 * probar con una secuencia conocida. Quien la llama decide la fuente de aleatoriedad.
 */
export function construirCodigo(bytes: Uint8Array): string {
  let codigo = "";

  for (let indice = 0; indice < LONGITUD_CODIGO; indice += 1) {
    codigo += ALFABETO[bytes[indice] % ALFABETO.length];
  }

  return codigo;
}

export function calcularVencimiento(desde: Date): Date {
  return new Date(desde.getTime() + VIGENCIA_MINUTOS * 60_000);
}

export function estaVigente(expiraEn: string | null, ahora: Date): boolean {
  return expiraEn !== null && new Date(expiraEn) > ahora;
}

/** Segundos que le quedan al código, o 0 si ya venció. */
export function segundosRestantes(expiraEn: string | null, ahora: Date): number {
  if (!expiraEn) {
    return 0;
  }

  const restante = Math.floor((new Date(expiraEn).getTime() - ahora.getTime()) / 1000);
  return Math.max(0, restante);
}
