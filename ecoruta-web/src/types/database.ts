/**
 * Alias del esquema, con nombres cómodos para el resto del código.
 *
 * Los tipos reales viven en `database.generated.ts`, que sale del esquema de Supabase
 * y NO se edita a mano. Este archivo solo le pone nombre a lo que la aplicación usa,
 * para que un `import type { Ruta }` no obligue a conocer la forma del generador.
 *
 * Regenerar tras cualquier migración:
 *   npm run types:db
 */

import type { Database, Tables } from "./database.generated";

export type { Database };

export type Ruta = Tables<"rutas">;
export type Parada = Tables<"paradas">;
export type Unidad = Tables<"unidades">;
export type Dispositivo = Tables<"dispositivos">;
export type Viaje = Tables<"viajes">;
export type Posicion = Tables<"posiciones">;
export type EventoGeocerca = Tables<"eventos_geocerca">;
export type AvisoParada = Tables<"avisos_parada">;
export type Incidencia = Tables<"incidencias">;
export type Parametro = Tables<"parametros">;

type FilaParadaCercana =
  Database["public"]["Functions"]["paradas_cercanas"]["Returns"][number];

type ColumnasDeRuta = "ruta_id" | "ruta_nombre" | "ruta_tipo" | "ruta_icono" | "ruta_color";

/**
 * Fila que devuelve la función PostGIS `paradas_cercanas`.
 *
 * El generador declara las columnas de ruta como obligatorias porque no lee el
 * `left join`, pero una parada por la que todavía no pasa ninguna ruta llega con
 * ellas en null. Se corrigen aquí para que el compilador obligue a tratar ese caso.
 */
export type ParadaCercanaRow = Omit<FilaParadaCercana, ColumnasDeRuta> & {
  [Columna in ColumnasDeRuta]: FilaParadaCercana[Columna] | null;
};
