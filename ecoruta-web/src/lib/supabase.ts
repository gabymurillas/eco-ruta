import { createClient } from "@supabase/supabase-js";

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

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
