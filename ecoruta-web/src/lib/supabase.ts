import { createClient } from "@supabase/supabase-js";

// Cliente de Supabase. Por regla del proyecto, se importa SOLO desde services/
// (ver CLAUDE.md → "Arquitectura de código y organización").
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
