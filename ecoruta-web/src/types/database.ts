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

/** Fila que devuelve la función PostGIS `paradas_cercanas`. */
export type ParadaCercanaRow =
  Database["public"]["Functions"]["paradas_cercanas"]["Returns"][number];
