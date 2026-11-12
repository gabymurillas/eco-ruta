import { clienteNavegador } from "@/lib/supabase/client";
import type { RutaDeMapa } from "./mapa.service";
import { exito, falloRegistrado, type Resultado } from "./resultado";

/**
 * Geometría de las rutas activas para el mapa del ciudadano, desde el navegador y
 * sin sesión. Es la misma consulta que usa el admin (`obtenerRutasDeMapa`); va en
 * archivo aparte porque aquel importa el cliente de servidor (`next/headers`).
 * El trazado es público: ver la política de exposición.
 */
export async function obtenerRutasDeMapaPublicas(): Promise<Resultado<RutaDeMapa[]>> {
  const { data, error } = await clienteNavegador().rpc("rutas_para_mapa");

  if (error) {
    return falloRegistrado(
      "rutas_para_mapa (navegador)",
      error,
      "No se pudo cargar el trazado de las rutas.",
    );
  }

  return exito(data ?? []);
}

export type HorarioDeRuta = { rutaId: string; nombre: string; horario: string };

/**
 * Horario de servicio que el admin escribió en cada ruta (texto libre). Solo
 * vuelven las rutas activas que tienen uno: la política pública ya filtra por
 * `activa`.
 */
export async function obtenerHorariosDeRutas(
  rutaIds: readonly string[],
): Promise<Resultado<HorarioDeRuta[]>> {
  const { data, error } = await clienteNavegador()
    .from("rutas")
    .select("id, nombre, horario")
    .in("id", [...rutaIds])
    .not("horario", "is", null);

  if (error) {
    return falloRegistrado("horarios de rutas (navegador)", error, "No se pudo cargar el horario.");
  }

  return exito(
    (data ?? [])
      .filter((fila) => fila.horario && fila.horario.trim() !== "")
      .map((fila) => ({ rutaId: fila.id, nombre: fila.nombre, horario: fila.horario!.trim() })),
  );
}
