import type { ParadaGuardada } from "@/features/seguimiento/types";

/**
 * Lo que la web recuerda del ciudadano, solo en su navegador.
 *
 * El ciudadano no tiene cuenta, así que esto no viaja a ningún servidor: vive
 * en `localStorage` de ese teléfono. Si el navegador lo bloquea (modo
 * incógnito, almacenamiento lleno) la web funciona igual, solo que no recuerda
 * nada entre visitas. Por eso nada de aquí lanza errores.
 */

const CLAVE_MI_PARADA = "ecoruta.mi-parada";
const CLAVE_LIMITACIONES_VISTAS = "ecoruta.limitaciones-vistas";

export function leerMiParada(): ParadaGuardada | null {
  const guardada = leer(CLAVE_MI_PARADA);

  if (!guardada) {
    return null;
  }

  try {
    const parada = JSON.parse(guardada) as ParadaGuardada;
    return esParadaGuardada(parada) ? parada : null;
  } catch {
    return null;
  }
}

export function guardarMiParada(parada: ParadaGuardada): void {
  escribir(CLAVE_MI_PARADA, JSON.stringify(parada));
}

export function limitacionesYaVistas(): boolean {
  return leer(CLAVE_LIMITACIONES_VISTAS) === "si";
}

export function marcarLimitacionesVistas(): void {
  escribir(CLAVE_LIMITACIONES_VISTAS, "si");
}

/**
 * Lo guardado puede venir de una versión anterior de la web con otra forma.
 * Mejor olvidarlo que mostrar una parada a medias.
 */
function esParadaGuardada(valor: ParadaGuardada): boolean {
  return (
    typeof valor?.paradaId === "string" &&
    typeof valor.nombre === "string" &&
    Number.isFinite(valor.lat) &&
    Number.isFinite(valor.lng) &&
    Array.isArray(valor.rutas)
  );
}

function leer(clave: string): string | null {
  try {
    return localStorage.getItem(clave);
  } catch {
    return null;
  }
}

function escribir(clave: string, valor: string): void {
  try {
    localStorage.setItem(clave, valor);
  } catch {
    // Sin almacenamiento la web sigue funcionando; solo no recuerda.
  }
}
