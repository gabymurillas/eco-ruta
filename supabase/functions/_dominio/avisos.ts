import { salidaConfirmada, type EstadoDeParada } from "./geocerca.ts";

/**
 * Avisos al ciudadano: «se acerca a tu parada» y «ya pasó por tu parada».
 *
 * Funciones puras, como las de `geocerca.ts`, y separadas de ellas a propósito:
 * la geocerca lleva el estado de cada parada (entró, permanece, salió) y estas
 * reglas solo deciden qué se le dice al ciudadano a partir de ese estado. No
 * cambian ninguno de los cinco pasos.
 *
 * Por qué no se avisa «está en tu parada»: en San Juan de los Morros los buses
 * no esperan en la parada. Ese aviso exige permanencia y llegaría tarde o
 * nunca. Lo útil es avisar con margen para caminar, y avisar cuando ya se fue
 * para que nadie se quede esperando un bus que pasó.
 */

export type EstadoParaAvisos = EstadoDeParada & {
  /** El punto suavizado cae dentro de `radio_aproximacion_m` de la parada. */
  dentroAproximacion: boolean;
  avisadoAcercamiento: boolean;
  avisadoPaso: boolean;
};

export type TipoAviso = "acercandose" | "paso";

export type Aviso = { tipo: TipoAviso; paradaId: string };

export function decidirAvisos(
  estados: EstadoParaAvisos[],
  ahora: Date,
  histeresisSalidaS: number,
): Aviso[] {
  return estados
    .filter((estado) => estado.notifica)
    .flatMap((estado) => decidirUno(estado, ahora, histeresisSalidaS));
}

function decidirUno(
  estado: EstadoParaAvisos,
  ahora: Date,
  histeresisSalidaS: number,
): Aviso[] {
  const { paradaId } = estado;

  if (debeAvisarAcercamiento(estado)) {
    return [{ tipo: "acercandose", paradaId }];
  }

  if (!estado.avisadoPaso && salidaConfirmada(estado.salioAt, ahora, histeresisSalidaS)) {
    return [{ tipo: "paso", paradaId }];
  }

  return [];
}

/**
 * `entroAt === null` es lo que da la dirección: la unidad todavía no ha estado
 * en esta parada durante el viaje, así que viene hacia ella. Un bus que ya pasó
 * y se aleja sigue a menos del radio de aproximación, pero ya tiene evento y no
 * vuelve a avisar.
 *
 * Si ya está dentro del radio de la parada, no «se acerca»: llegó. Pasa cuando
 * el viaje arranca en la propia parada o cuando la señal se cortó en el camino.
 */
function debeAvisarAcercamiento(estado: EstadoParaAvisos): boolean {
  return (
    estado.dentroAproximacion &&
    !estado.dentro &&
    estado.entroAt === null &&
    !estado.avisadoAcercamiento
  );
}
