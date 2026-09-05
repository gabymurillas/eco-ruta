-- ============================================================
-- EcoRuta San Juan — Esquema de base de datos
-- Requiere PostGIS (ya activado)
-- ============================================================

-- ── RUTAS ──
create table rutas (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  color         text not null,
  trazado       geography(LineString, 4326),
  horario       text,
  activa        boolean not null default true,
  creada_at     timestamptz not null default now()
);

create index rutas_trazado_gix on rutas using gist (trazado);


-- ── PARADAS Y GEOCERCAS ──
create table paradas (
  id               uuid primary key default gen_random_uuid(),
  ruta_id          uuid not null references rutas(id) on delete cascade,
  nombre           text not null,
  orden            int  not null,
  ubicacion        geography(Point, 4326) not null,
  radio_geocerca_m int not null default 150,
  notifica         boolean not null default true,
  unique (ruta_id, orden)
);

create index paradas_ubicacion_gix on paradas using gist (ubicacion);
create index paradas_ruta_idx on paradas (ruta_id);


-- ── UNIDADES ──
create table unidades (
  id       uuid primary key default gen_random_uuid(),
  nombre   text not null,
  tipo     text not null check (tipo in ('transporte','recoleccion')),
  ruta_id  uuid references rutas(id) on delete set null,
  activa   boolean not null default true
);

create index unidades_ruta_idx on unidades (ruta_id);


-- ── DISPOSITIVOS (teléfono-baliza de la ruta) ──
create table dispositivos (
  id                 uuid primary key default gen_random_uuid(),
  unidad_id          uuid not null unique references unidades(id) on delete cascade,
  codigo_vinculacion text,
  codigo_expira_at   timestamptz,
  vinculado          boolean not null default false,
  push_token         text,
  ultima_bateria     int,
  ultima_senal_at    timestamptz,
  vinculado_at       timestamptz
);

create unique index dispositivos_codigo_idx
  on dispositivos (codigo_vinculacion)
  where codigo_vinculacion is not null;


-- ── VIAJES (un recorrido, de "iniciar" a "finalizar") ──
create table viajes (
  id            uuid primary key default gen_random_uuid(),
  unidad_id     uuid not null references unidades(id) on delete cascade,
  ruta_id       uuid not null references rutas(id),
  iniciado_at   timestamptz not null default now(),
  finalizado_at timestamptz
);

create index viajes_unidad_idx on viajes (unidad_id, iniciado_at desc);

create unique index viajes_abierto_idx
  on viajes (unidad_id)
  where finalizado_at is null;


-- ── POSICIONES (tabla de alta escritura) ──
create table posiciones (
  id            bigserial primary key,
  unidad_id     uuid not null references unidades(id) on delete cascade,
  viaje_id      uuid references viajes(id) on delete cascade,
  ubicacion     geography(Point, 4326) not null,
  velocidad_kmh numeric,
  exactitud_m   numeric,
  usable        boolean not null default true,
  capturado_at  timestamptz not null,
  recibido_at   timestamptz not null default now()
);

create index posiciones_ubicacion_gix on posiciones using gist (ubicacion);
create index posiciones_unidad_tiempo_idx on posiciones (unidad_id, capturado_at desc);
create index posiciones_viaje_idx on posiciones (viaje_id);


-- ── EVENTOS DE GEOCERCA (control anti-spam de notificaciones) ──
create table eventos_geocerca (
  id            uuid primary key default gen_random_uuid(),
  viaje_id      uuid not null references viajes(id) on delete cascade,
  unidad_id     uuid not null references unidades(id) on delete cascade,
  parada_id     uuid not null references paradas(id) on delete cascade,
  entro_at      timestamptz not null,
  notificado_at timestamptz,
  salio_at      timestamptz,
  unique (viaje_id, parada_id)
);

create index eventos_geocerca_activos_idx
  on eventos_geocerca (unidad_id)
  where salio_at is null;


-- ── INCIDENCIAS ──
create table incidencias (
  id          uuid primary key default gen_random_uuid(),
  ruta_id     uuid not null references rutas(id) on delete cascade,
  unidad_id   uuid references unidades(id) on delete set null,
  tipo        text not null check (tipo in ('calle_cerrada','falla_mecanica','desvio','congestion')),
  descripcion text,
  ubicacion   geography(Point, 4326),
  activa      boolean not null default true,
  creada_at   timestamptz not null default now(),
  resuelta_at timestamptz
);

create index incidencias_ubicacion_gix on incidencias using gist (ubicacion);
create index incidencias_activas_idx on incidencias (ruta_id) where activa;
