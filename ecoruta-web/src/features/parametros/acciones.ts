"use server";

import { revalidatePath } from "next/cache";
import { DEFINICIONES, validarParametros } from "@/domain/parametros";
import { guardarParametros } from "@/services/parametros.service";

export type EstadoGuardado = {
  error?: string;
  erroresPorClave?: Record<string, string>;
  guardadoEn?: string;
};

export async function guardar(
  _estadoPrevio: EstadoGuardado,
  datos: FormData,
): Promise<EstadoGuardado> {
  const valores = new Map<string, number>();

  for (const definicion of DEFINICIONES) {
    const crudo = datos.get(definicion.clave);

    // Solo llegan los campos cambiados: así no se pisa lo que otro admin guardó
    // mientras esta pestaña estaba abierta. Un campo vacío no es cero.
    if (crudo !== null) {
      valores.set(definicion.clave, String(crudo).trim() === "" ? Number.NaN : Number(crudo));
    }
  }

  const errores = validarParametros(valores);

  if (errores.length > 0) {
    return {
      error: "Revisa los valores marcados.",
      erroresPorClave: Object.fromEntries(
        errores.map(({ clave, mensaje }) => [clave, mensaje]),
      ),
    };
  }

  const resultado = await guardarParametros(valores);

  if (!resultado.ok) {
    return { error: resultado.error };
  }

  // El radio inicial de las paradas se deriva de la exactitud máxima.
  revalidatePath("/admin/parametros");
  revalidatePath("/admin/paradas");

  return { guardadoEn: new Date().toISOString() };
}
