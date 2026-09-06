import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Cliente de Supabase. Por regla del proyecto se importa SOLO desde services/:
 * ninguna vista ni hook habla directamente con la base de datos.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local",
  );
}

/**
 * Tipado con el esquema generado: las consultas y los RPC se validan contra las
 * tablas reales, así que un nombre de columna mal escrito no compila.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
