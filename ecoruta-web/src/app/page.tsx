import { supabase } from "@/lib/supabase";

// Página de verificación temporal: confirma que la conexión con Supabase y
// las políticas RLS de lectura pública funcionan. Se reemplaza por la
// feature real de seguimiento (con su capa de services/ y features/hooks/).
export default async function Home() {
  const { data: rutas, error } = await supabase.from("rutas").select("id");

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <main className="text-center">
        <h1 className="text-2xl font-semibold">EcoRuta San Juan</h1>
        {error ? (
          <p className="mt-4 text-red-600">Error de conexión: {error.message}</p>
        ) : (
          <p className="mt-4 text-lg">Rutas encontradas: {rutas?.length ?? 0}</p>
        )}
      </main>
    </div>
  );
}
