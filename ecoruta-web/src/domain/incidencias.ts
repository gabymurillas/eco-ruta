const ETIQUETA_POR_TIPO: Record<string, string> = {
  calle_cerrada: "Calle cerrada",
  falla_mecanica: "Falla mecánica",
  desvio: "Desvío",
  congestion: "Congestión",
  otro: "Observación del conductor",
};

/**
 * Un tipo que la base acepte y este mapa todavía no conozca se muestra tal cual
 * en vez de esconder la incidencia: verla con un nombre feo es mejor que no verla.
 */
export function etiquetarTipoIncidencia(tipo: string): string {
  return ETIQUETA_POR_TIPO[tipo] ?? tipo;
}
