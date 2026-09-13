/**
 * Variables de entorno, leídas y validadas en un solo lugar.
 *
 * Sin esto el build pasa sin problemas y el sitio falla recién al abrirse, con el
 * mensaje «supabaseUrl is required» — que no dice qué falta ni dónde configurarlo.
 * Un despliegue roto que parece exitoso es peor que uno que no compila.
 *
 * Las dos son `NEXT_PUBLIC_`, así que Next las incrusta en el JavaScript del navegador:
 * son públicas por diseño. Quien proteja los datos es RLS en la base, no el secreto de
 * la clave. La clave `service_role` y el token de acceso de Supabase NO van aquí ni
 * llevan ese prefijo: darían acceso total saltándose RLS.
 */

const FALTANTE =
  "Falta %s. Agrégala en .env.local para desarrollo, o en las variables de entorno del proyecto en Vercel. Ver .env.local.example.";

function exigir(nombre: string, valor: string | undefined): string {
  if (!valor) {
    throw new Error(FALTANTE.replace("%s", nombre));
  }

  return valor;
}

export const SUPABASE_URL = exigir(
  "NEXT_PUBLIC_SUPABASE_URL",
  process.env.NEXT_PUBLIC_SUPABASE_URL,
);

export const SUPABASE_ANON_KEY = exigir(
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
