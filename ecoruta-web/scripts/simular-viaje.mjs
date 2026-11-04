/**
 * Simula el teléfono de una unidad recorriendo su ruta.
 *
 * Hace exactamente lo que hace la app Android: se vincula con un código, abre un
 * viaje, manda posiciones a `registrar-posicion` y reporta el latido. Por eso
 * prueba el sistema de verdad —suavizado, geocercas, avisos al ciudadano y el
 * mapa del admin— y no una imitación escrita directo en la base.
 *
 * Uso (desde ecoruta-web/):
 *   node --env-file=.env.local scripts/simular-viaje.mjs --codigo 4T9K2   # la primera vez
 *   node --env-file=.env.local scripts/simular-viaje.mjs                  # las siguientes
 *
 * Opciones: --velocidad <km/h> (30)  --parada <s> (20, tiempo detenido en cada parada)
 *
 * El código sale de /admin/unidades → «Vincular». Ojo: vincular desvincula el
 * teléfono que tuviera esa unidad, así que usa una unidad dedicada a pruebas.
 * La sesión queda en .simulador.local.json (ignorado por git) para no pedir
 * otro código en cada corrida.
 *
 * Los tiempos no se pueden acelerar: la permanencia y la histéresis se miden con
 * el reloj del servidor.
 */

import { readFile, writeFile } from "node:fs/promises";

const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CLAVE = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ARCHIVO_SESION = new URL("../.simulador.local.json", import.meta.url);
const INTERVALO_S = 5;

let emisiones = 0;

if (!URL_BASE || !CLAVE) {
  salir("Falta .env.local: corre con node --env-file=.env.local");
}

const opciones = leerOpciones(process.argv.slice(2));
const sesion = await obtenerSesion(opciones.codigo);
const unidad = await pedir("GET", `/rest/v1/unidades?id=eq.${sesion.unidadId}&select=nombre,ruta_id`);

if (!unidad[0]?.ruta_id) {
  salir("La unidad no tiene ruta asignada. Asígnale una en /admin/unidades.");
}

const rutaId = unidad[0].ruta_id;
const ruta = (await pedir("POST", "/rest/v1/rpc/rutas_para_mapa", {})).find((r) => r.ruta_id === rutaId);

if (!ruta?.trazado_geojson) {
  salir("La ruta de la unidad no tiene trazado (o está inactiva). Dibújalo en el admin.");
}

const paradas = await pedir("POST", "/rest/v1/rpc/paradas_de_ruta", { ruta: rutaId });
const puntos = ruta.trazado_geojson.coordinates.map(([lng, lat]) => ({ lat, lng }));

console.log(`${unidad[0].nombre} · ${ruta.ruta_nombre} · ${Math.round(largo(puntos))} m`);
console.log(
  paradas.length
    ? `Paradas en el recorrido: ${paradas.map((p) => p.parada_nombre).join(", ")}`
    : "Aviso: la ruta no pasa por ninguna parada (a menos de distancia_parada_trazado_m). No habrá avisos.",
);

// La base admite un solo viaje abierto por unidad; uno olvidado bloquearía este.
await pedir("PATCH", `/rest/v1/viajes?unidad_id=eq.${sesion.unidadId}&finalizado_at=is.null`, {
  finalizado_at: new Date().toISOString(),
});
const [viaje] = await pedir("POST", "/rest/v1/viajes", { unidad_id: sesion.unidadId, ruta_id: rutaId });

process.on("SIGINT", async () => {
  await cerrarViaje(viaje.id);
  process.exit(130);
});

console.log(`Viaje ${viaje.id} abierto. Ctrl+C lo cierra.\n`);

const paso = (opciones.velocidad / 3.6) * INTERVALO_S;
const yaDetenido = new Set();

for (const punto of recorrer(puntos, paso)) {
  await emitir(viaje.id, punto, opciones.velocidad);

  const parada = paradas.find(
    (p) => !yaDetenido.has(p.parada_id) && distancia(punto, { lat: p.parada_lat, lng: p.parada_lng }) < Math.max(paso, p.radio_geocerca_m / 2),
  );

  if (parada) {
    yaDetenido.add(parada.parada_id);
    const enParada = { lat: parada.parada_lat, lng: parada.parada_lng };

    for (let s = 0; s < opciones.parada; s += INTERVALO_S) {
      await emitir(viaje.id, enParada, 0, `detenido en ${parada.parada_nombre}`);
    }
  }
}

// Al final se queda quieto lo que dura la histéresis, para que la última parada
// alcance a confirmar su salida y salga el aviso «ya pasó».
const final = puntos[puntos.length - 1];

for (let s = 0; s < 40; s += INTERVALO_S) {
  await emitir(viaje.id, final, 0, "fin del recorrido");
}

await cerrarViaje(viaje.id);


// ── Telemetría ──

async function emitir(viajeId, { lat, lng }, velocidad, nota = "") {
  const respuesta = await pedir("POST", "/functions/v1/registrar-posicion", {
    viaje_id: viajeId,
    posiciones: [
      { lat, lng, exactitud_m: 8, velocidad_kmh: velocidad, capturado_at: new Date().toISOString() },
    ],
  });

  const sucesos = [
    ...(respuesta.avisos ?? []).map((a) => `AVISO ${a.tipo} → ${a.parada}`),
    ...(respuesta.notificadas ?? []).map((n) => `notificada ${n}`),
  ];

  console.log(`${hora()}  ${lat.toFixed(5)}, ${lng.toFixed(5)}  ${nota}  ${sucesos.join(" · ")}`);

  if (emisiones++ % 6 === 0) {
    await pedir("POST", "/rest/v1/rpc/registrar_salud_del_dispositivo", { bateria: 80 });
  }

  await new Promise((r) => setTimeout(r, INTERVALO_S * 1000));
}

async function cerrarViaje(viajeId) {
  await pedir("PATCH", `/rest/v1/viajes?id=eq.${viajeId}`, { finalizado_at: new Date().toISOString() });
  console.log(`\nViaje ${viajeId} cerrado.`);
}


// ── Sesión del dispositivo ──

async function obtenerSesion(codigo) {
  if (codigo) {
    const r = await fetch(`${URL_BASE}/functions/v1/vincular-dispositivo`, {
      method: "POST",
      headers: { apikey: CLAVE, "Content-Type": "application/json" },
      body: JSON.stringify({ codigo }),
    });
    const cuerpo = await r.json();

    if (!r.ok) salir(`Vinculación: ${cuerpo.error ?? r.status}`);

    return guardarSesion(cuerpo.unidad.id, cuerpo.sesion);
  }

  let guardada;

  try {
    guardada = JSON.parse(await readFile(ARCHIVO_SESION, "utf8"));
  } catch {
    salir("No hay sesión guardada. Genera un código en /admin/unidades y usa --codigo.");
  }

  const r = await fetch(`${URL_BASE}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { apikey: CLAVE, "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: guardada.refreshToken }),
  });

  if (!r.ok) salir("La sesión guardada ya no sirve (¿se revinculó la unidad?). Usa --codigo.");

  return guardarSesion(guardada.unidadId, await r.json());
}

async function guardarSesion(unidadId, { access_token, refresh_token }) {
  const datos = { unidadId, accessToken: access_token, refreshToken: refresh_token };

  // El refresh token rota en cada uso: si no se guarda el nuevo, la próxima
  // corrida no podría renovar.
  await writeFile(ARCHIVO_SESION, JSON.stringify({ unidadId, refreshToken: refresh_token }));
  return datos;
}

async function pedir(metodo, ruta, cuerpo) {
  const r = await fetch(`${URL_BASE}${ruta}`, {
    method: metodo,
    headers: {
      apikey: CLAVE,
      Authorization: `Bearer ${sesion?.accessToken ?? CLAVE}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  const texto = await r.text();

  if (!r.ok) salir(`${metodo} ${ruta.split("?")[0]} → ${r.status} ${texto}`);

  return texto ? JSON.parse(texto) : null;
}


// ── Geometría ──

/** Puntos a `paso` metros uno de otro a lo largo de la línea, incluidos los extremos. */
function* recorrer(linea, paso) {
  yield linea[0];
  let resto = paso;

  for (let i = 1; i < linea.length; i++) {
    const [a, b] = [linea[i - 1], linea[i]];
    const tramo = distancia(a, b);
    let recorrido = resto;

    while (recorrido <= tramo) {
      const t = recorrido / tramo;
      yield { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
      recorrido += paso;
    }

    resto = recorrido - tramo;
  }

  yield linea[linea.length - 1];
}

function largo(linea) {
  return linea.slice(1).reduce((suma, p, i) => suma + distancia(linea[i], p), 0);
}

function distancia(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}


// ── Utilidades ──

function leerOpciones(args) {
  const valor = (nombre) => {
    const i = args.indexOf(`--${nombre}`);
    return i >= 0 ? args[i + 1] : undefined;
  };

  return {
    codigo: valor("codigo")?.toUpperCase(),
    velocidad: Number(valor("velocidad") ?? 30),
    parada: Number(valor("parada") ?? 20),
  };
}

function hora() {
  return new Date().toLocaleTimeString("es-VE", { hour12: false });
}

function salir(mensaje) {
  console.error(mensaje);
  process.exit(1);
}
