import { CENTRO_SAN_JUAN } from "@/domain/mapa";
import type { Lugar } from "@/domain/lugares";
import { exito, falloRegistrado, type Resultado } from "./resultado";

/**
 * Photon (de Komoot) busca sobre los datos de OpenStreetMap, los mismos del mapa.
 * Es gratis, no pide clave y, a diferencia de Nominatim, admite búsquedas mientras
 * se escribe. A cambio es un servicio público de uso razonable: el buscador espera
 * a que el admin deje de teclear antes de consultar.
 */
const PHOTON = "https://photon.komoot.io/api/";

/** Venezuela entera: oeste, sur, este, norte. */
const VENEZUELA = "-73.4,0.6,-59.8,12.3";

const MAXIMO_RESULTADOS = 6;

type RespuestaPhoton = {
  features: {
    geometry: { coordinates: [number, number] };
    properties: {
      osm_type?: string;
      osm_id?: number;
      name?: string;
      street?: string;
      housenumber?: string;
      district?: string;
      city?: string;
      state?: string;
    };
  }[];
};

export async function buscarLugares(
  texto: string,
  senal?: AbortSignal,
): Promise<Resultado<Lugar[]>> {
  const parametros = new URLSearchParams({
    q: texto,
    limit: String(MAXIMO_RESULTADOS),
    // Primero lo cercano a San Juan de los Morros: «Plaza Bolívar» hay en cada pueblo.
    lat: String(CENTRO_SAN_JUAN.lat),
    lon: String(CENTRO_SAN_JUAN.lng),
    bbox: VENEZUELA,
  });

  try {
    const respuesta = await fetch(`${PHOTON}?${parametros}`, { signal: senal });

    if (!respuesta.ok) {
      return falloRegistrado(
        "buscar_lugares",
        respuesta.status,
        "El buscador no responde. Puedes ubicar la parada tocando el mapa.",
      );
    }

    const datos = (await respuesta.json()) as RespuestaPhoton;
    return exito(datos.features.map(aLugar));
  } catch (causa) {
    if (causa instanceof DOMException && causa.name === "AbortError") {
      return exito([]);
    }

    return falloRegistrado(
      "buscar_lugares",
      causa,
      "No hay conexión con el buscador. Puedes ubicar la parada tocando el mapa.",
    );
  }
}

function aLugar(
  { geometry, properties }: RespuestaPhoton["features"][number],
  indice: number,
): Lugar {
  const [lng, lat] = geometry.coordinates;
  const calle = [properties.street, properties.housenumber].filter(Boolean).join(" ");
  const nombre = properties.name ?? (calle || "Lugar sin nombre");
  const detalle = [
    properties.name ? calle : null,
    properties.district,
    properties.city,
    properties.state,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    id: `${properties.osm_type ?? "x"}${properties.osm_id ?? indice}`,
    nombre,
    detalle,
    lat,
    lng,
  };
}
