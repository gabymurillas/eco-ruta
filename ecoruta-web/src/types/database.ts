/**
 * Tipos del esquema de Supabase, acotados a las tablas del dominio.
 *
 * El generador de Supabase incluye además toda la superficie de PostGIS (~1500 líneas),
 * que no aporta nada al código de la aplicación y rompe el límite de tamaño por archivo.
 * Si hiciera falta el archivo completo, se regenera con:
 *   npx supabase gen types typescript --project-id <ref>
 */

export type Ruta = {
  id: string;
  nombre: string;
  tipo: string | null;
  icono: string | null;
  color: string;
  horario: string | null;
  activa: boolean;
  creada_at: string;
};

export type Parada = {
  id: string;
  ruta_id: string;
  nombre: string;
  orden: number;
  radio_geocerca_m: number;
  notifica: boolean;
};

export type Unidad = {
  id: string;
  nombre: string;
  ruta_id: string | null;
  activa: boolean;
};

export type Viaje = {
  id: string;
  unidad_id: string;
  ruta_id: string;
  iniciado_at: string;
  finalizado_at: string | null;
};

export type Posicion = {
  id: number;
  unidad_id: string;
  viaje_id: string | null;
  velocidad_kmh: number | null;
  exactitud_m: number | null;
  usable: boolean;
  capturado_at: string;
  recibido_at: string;
};

export type Incidencia = {
  id: string;
  ruta_id: string;
  unidad_id: string | null;
  tipo: string;
  descripcion: string | null;
  activa: boolean;
  creada_at: string;
  resuelta_at: string | null;
};

export type Parametro = {
  clave: string;
  valor: number;
  descripcion: string | null;
};

/** Fila que devuelve la función PostGIS `paradas_cercanas`. */
export type ParadaCercanaRow = {
  parada_id: string;
  parada_nombre: string;
  distancia_m: number;
  ruta_id: string;
  ruta_nombre: string;
  ruta_tipo: string | null;
  ruta_icono: string | null;
  ruta_color: string;
};
