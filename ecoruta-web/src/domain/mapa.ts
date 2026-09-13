/**
 * Geometría del mapa. Funciones puras: entran datos, salen datos.
 *
 * GeoJSON usa el orden [lng, lat] y Leaflet el contrario, [lat, lng]. Invertirlos en
 * cada componente es la clase de error que se ve tarde: el mapa dibuja en el océano
 * frente a África, donde caen las coordenadas cambiadas. La conversión vive aquí, una
 * sola vez.
 */

export type Punto = {
  lat: number;
  lng: number;
};

/** Centro de San Juan de los Morros: a dónde mira el mapa cuando no hay nada que encuadrar. */
export const CENTRO_SAN_JUAN: Punto = { lat: 9.9075, lng: -67.3538 };

export const ZOOM_CIUDAD = 14;
export const ZOOM_PARADA = 16;

type LineStringGeoJson = {
  type: string;
  coordinates: [number, number][];
};

/** Convierte el trazado que devuelve PostGIS al orden que espera Leaflet. */
export function trazadoALatLng(geojson: unknown): Punto[] {
  if (!esLineString(geojson)) {
    return [];
  }

  return geojson.coordinates.map(([lng, lat]) => ({ lat, lng }));
}

function esLineString(valor: unknown): valor is LineStringGeoJson {
  if (typeof valor !== "object" || valor === null) {
    return false;
  }

  const posible = valor as Partial<LineStringGeoJson>;

  return (
    posible.type === "LineString" &&
    Array.isArray(posible.coordinates) &&
    posible.coordinates.every(
      (par) =>
        Array.isArray(par) &&
        par.length >= 2 &&
        typeof par[0] === "number" &&
        typeof par[1] === "number",
    )
  );
}

/** El orden inverso, para guardar lo que el admin dibujó. */
export function latLngATrazado(puntos: readonly Punto[]): [number, number][] {
  return puntos.map(({ lat, lng }) => [lng, lat]);
}

export type Encuadre = {
  centro: Punto;
  puntos: Punto[];
};

/**
 * Qué debe quedar visible al abrir el mapa.
 *
 * Con un solo punto no hay caja que encuadrar, así que se centra en él. Sin ningún
 * punto se cae al centro de la ciudad en vez de al [0, 0] que Leaflet usaría por
 * defecto, que está en medio del Atlántico.
 */
export function calcularEncuadre(puntos: readonly Punto[]): Encuadre {
  if (puntos.length === 0) {
    return { centro: CENTRO_SAN_JUAN, puntos: [] };
  }

  const suma = puntos.reduce(
    (acumulado, punto) => ({
      lat: acumulado.lat + punto.lat,
      lng: acumulado.lng + punto.lng,
    }),
    { lat: 0, lng: 0 },
  );

  return {
    centro: { lat: suma.lat / puntos.length, lng: suma.lng / puntos.length },
    puntos: [...puntos],
  };
}
