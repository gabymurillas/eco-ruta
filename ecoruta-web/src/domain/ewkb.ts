/**
 * Lectura de columnas `geography` tal como las entrega PostgREST: EWKB en
 * hexadecimal (el formato de salida de PostGIS). Leerlas aquí evita una vista o
 * una función SQL solo para sacar coordenadas.
 *
 * Solo se aceptan las dos formas que usa el modelo, con SRID: punto (paradas,
 * incidencias) y línea (trazados). Cualquier otra cosa devuelve null y la
 * pantalla se muestra sin mapa en vez de romperse.
 */

import type { Punto } from "./mapa";

const CON_SRID = 0x20000000;
const TIPO_PUNTO = 1;
const TIPO_LINEA = 2;
// Orden de bytes (1) + tipo (4) + SRID (4).
const CABECERA_BYTES = 9;
const BYTES_POR_COORDENADA = 16;

type Lector = { vista: DataView; littleEndian: boolean; tipo: number };

function abrir(hex: unknown): Lector | null {
  if (typeof hex !== "string" || hex.length < CABECERA_BYTES * 2 || !/^[0-9a-fA-F]+$/.test(hex)) {
    return null;
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }

  const vista = new DataView(bytes.buffer);
  const littleEndian = bytes[0] === 1;
  const tipoCompleto = vista.getUint32(1, littleEndian);

  if ((tipoCompleto & CON_SRID) === 0) {
    return null;
  }

  return { vista, littleEndian, tipo: tipoCompleto & 0xff };
}

function leerCoordenada(lector: Lector, desplazamiento: number): Punto | null {
  const lng = lector.vista.getFloat64(desplazamiento, lector.littleEndian);
  const lat = lector.vista.getFloat64(desplazamiento + 8, lector.littleEndian);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return null;
  }

  return { lat, lng };
}

export function leerPuntoEwkb(hex: unknown): Punto | null {
  const lector = abrir(hex);
  if (!lector || lector.tipo !== TIPO_PUNTO || lector.vista.byteLength !== CABECERA_BYTES + BYTES_POR_COORDENADA) {
    return null;
  }

  return leerCoordenada(lector, CABECERA_BYTES);
}

export function leerLineaEwkb(hex: unknown): Punto[] | null {
  const lector = abrir(hex);
  if (!lector || lector.tipo !== TIPO_LINEA) {
    return null;
  }

  const cantidad = lector.vista.getUint32(CABECERA_BYTES, lector.littleEndian);
  const inicio = CABECERA_BYTES + 4;
  if (lector.vista.byteLength !== inicio + cantidad * BYTES_POR_COORDENADA) {
    return null;
  }

  const puntos: Punto[] = [];
  for (let i = 0; i < cantidad; i++) {
    const punto = leerCoordenada(lector, inicio + i * BYTES_POR_COORDENADA);
    if (!punto) {
      return null;
    }
    puntos.push(punto);
  }

  return puntos;
}
