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

    if (crudo !== null) {
      valores.set(definicion.clave, Number(crudo));
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

  // El radio sugerido del editor de rutas se deriva de la exactitud máxima,
  // así que esa pantalla también queda obsoleta al guardar aquí.
  revalidatePath("/admin/parametros");
  revalidatePath("/admin/rutas");

  return { guardadoEn: new Date().toISOString() };
}
