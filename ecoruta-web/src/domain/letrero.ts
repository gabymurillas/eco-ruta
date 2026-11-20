/**
 * Cómo se escribe el letrero que eligió el conductor (sql/21).
 *
 * Acompaña a un nombre —el de la ruta, o el de la unidad donde la ruta ya está a la
 * vista— y nunca lo reemplaza: el nombre de la ruta va con su color y su ícono, y
 * es lo que el ciudadano relaciona con la línea del mapa. El letrero solo dice
 * adónde va esta unidad ahora. Una sola función para que el monitoreo, mi parada y
 * el detalle de ruta lo digan igual.
 */
export function conLetrero(nombre: string, letrero: string | null): string {
  return letrero ? `${nombre} · ${letrero}` : nombre;
}
