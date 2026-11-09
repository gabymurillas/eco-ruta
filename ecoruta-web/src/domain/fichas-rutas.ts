/**
 * Reglas de presentación de la sección Rutas. Puras: no conocen ni la base ni React.
 */

export type GrupoDeTipo = { clave: string; texto: string; cantidad: number };

const SIN_TIPO = "sin-tipo";
const PARADAS_VISIBLES = 4;

/**
 * `rutas.tipo` es texto libre: «Aseo» y «aseo » son el mismo tipo para el
 * gestor. Se agrupa sin mayúsculas ni espacios y se muestra la primera forma
 * escrita.
 */
export function claveDeTipo(tipo: string | null): string {
  const limpio = tipo?.trim().toLowerCase();
  return limpio ? limpio : SIN_TIPO;
}

export function agruparPorTipo(rutas: readonly { tipo: string | null }[]): GrupoDeTipo[] {
  const grupos = new Map<string, GrupoDeTipo>();

  for (const ruta of rutas) {
    const clave = claveDeTipo(ruta.tipo);
    const grupo = grupos.get(clave);
    if (grupo) {
      grupo.cantidad++;
    } else {
      grupos.set(clave, { clave, texto: ruta.tipo?.trim() || "Sin tipo", cantidad: 1 });
    }
  }

  return [...grupos.values()].sort((a, b) => a.texto.localeCompare(b.texto, "es"));
}

/** «6,4 km», o en metros si no llega a uno. */
export function formatearLongitud(metros: number): string {
  if (metros < 1000) {
    return `${Math.round(metros)} m`;
  }
  return `${(metros / 1000).toLocaleString("es-VE", { maximumFractionDigits: 1 })} km`;
}

/** «2 · 1 en servicio», «1 · sin servicio» o «0». */
export function describirUnidades(total: number, enServicio: number): string {
  if (total === 0) {
    return "0";
  }
  return enServicio > 0 ? `${total} · ${enServicio} en servicio` : `${total} · sin servicio`;
}

/** Las primeras paradas del recorrido y cuántas quedan sin mostrar. */
export function resumirParadas(paradas: readonly string[]): { visibles: string[]; restantes: number } {
  return {
    visibles: paradas.slice(0, PARADAS_VISIBLES),
    restantes: Math.max(0, paradas.length - PARADAS_VISIBLES),
  };
}
