/**
 * Qué aviso de cada recorrido se le muestra al ciudadano.
 *
 * El servidor escribe dos por viaje y parada: «se acerca» y, después, «ya
 * pasó». En pantalla solo tiene sentido el último de cada viaje: si el bus ya
 * pasó, decirle que se acerca lo mandaría a esperar un bus que se fue.
 */

export type TipoAviso = "acercandose" | "paso";

export type Aviso = {
  id: string;
  viajeId: string;
  unidadId: string;
  tipo: TipoAviso;
  creadoAt: string;
};

/**
 * Pasado este tiempo un aviso deja de ser noticia. Un «se acerca» sin «ya
 * pasó» detrás puede ser un bus que se quedó accidentado; un «ya pasó» viejo
 * ya no le sirve a nadie que acaba de llegar a la parada.
 */
export const MINUTOS_DE_VIGENCIA = 10;

const MS_POR_MINUTO = 60_000;

const ORDEN: Record<TipoAviso, number> = { acercandose: 0, paso: 1 };

export function avisosVigentes(avisos: readonly Aviso[], ahora: Date): Aviso[] {
  const limite = ahora.getTime() - MINUTOS_DE_VIGENCIA * MS_POR_MINUTO;
  const ultimoPorViaje = new Map<string, Aviso>();

  for (const aviso of avisos) {
    if (new Date(aviso.creadoAt).getTime() < limite) {
      continue;
    }

    const actual = ultimoPorViaje.get(aviso.viajeId);

    if (!actual || ORDEN[aviso.tipo] > ORDEN[actual.tipo]) {
      ultimoPorViaje.set(aviso.viajeId, aviso);
    }
  }

  return [...ultimoPorViaje.values()];
}
