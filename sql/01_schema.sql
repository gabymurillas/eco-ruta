-- ============================================================
-- EcoRuta San Juan — Esquema de base de datos
-- Requiere PostGIS (ya activado)
-- ============================================================

-- ── RUTAS ──
-- 'tipo' es texto libre a propósito: el ente gestor registra el servicio que sea
-- (transporte, aseo, agua, gas) sin que haya que modificar el esquema.
-- 'icono' lo elige el admin al crear la ruta, junto al color. Tampoco lleva check:
-- agregar un ícono nuevo no debe requerir una migración. La interfaz dibuja un
-- marcador genérico cuando el valor es nulo o desconocido.
-- Valores que la interfaz reconoce hoy: bus, camion, cisterna, van, generico.
create table rutas (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  tipo          text,
  icono         text,
  color         text not null,
  trazado       geography(LineString, 4326),
  horario       text,
  activa        boolean not null default true,
  creada_at     timestamptz not null default now()
);

create index rutas_trazado_gix on rutas using gist (trazado);


-- ── PARADAS Y GEOCERCAS ──
-- Las paradas son de la ciudad, no de una ruta: una parada donde paran tres
-- rutas se registra una sola vez. Qué rutas pasan por ella no se guarda: lo
-- calcula la vista `paradas_por_ruta` (04_funciones.sql) a partir del trazado.
create table paradas (
  id               uuid primary key default gen_random_uuid(),
  nombre           text not null,
  ubicacion        geography(Point, 4326) not null,
  radio_geocerca_m int not null default 150,
  notifica         boolean not null default true
);

create index paradas_ubicacion_gix on paradas using gist (ubicacion);


-- ── UNIDADES ──
-- La unidad no declara qué servicio presta: eso lo dice la ruta a la que pertenece.
create table unidades (
  id       uuid primary key default gen_random_uuid(),
  nombre   text not null,
  ruta_id  uuid references rutas(id) on delete set null,
  activa   boolean not null default true
);

create index unidades_ruta_idx on unidades (ruta_id);


-- ── DISPOSITIVOS (teléfono-baliza de la ruta) ──
create table dispositivos (
  id                 uuid primary key default gen_random_uuid(),
  unidad_id          uuid not null unique references unidades(id) on delete cascade,
  -- Cuenta de Supabase Auth del teléfono. Su app_metadata.unidad_id es lo que lee
  -- RLS para decidir de qué unidad puede escribir posiciones.
  auth_user_id       uuid,
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


-- ── AVISOS AL CIUDADANO ──
-- Lo que sale hacia la web: «se acerca a tu parada» y «ya pasó por tu parada».
-- `eventos_geocerca` es el estado interno del algoritmo; esta tabla es solo lo
-- que se le dice al público, y la web la escucha por Realtime. El unique es la
-- misma garantía que en eventos_geocerca: un aviso de cada tipo por parada y
-- viaje, aunque la lógica fallara.
create table avisos_parada (
  id        uuid primary key default gen_random_uuid(),
  viaje_id  uuid not null references viajes(id) on delete cascade,
  unidad_id uuid not null references unidades(id) on delete cascade,
  parada_id uuid not null references paradas(id) on delete cascade,
  tipo      text not null check (tipo in ('acercandose','paso')),
  creado_at timestamptz not null default now(),
  unique (viaje_id, parada_id, tipo)
);

create index avisos_parada_parada_idx on avisos_parada (parada_id, creado_at desc);


-- ── INCIDENCIAS ──
create table incidencias (
  id          uuid primary key default gen_random_uuid(),
  ruta_id     uuid not null references rutas(id) on delete cascade,
  unidad_id   uuid references unidades(id) on delete set null,
  tipo        text not null check (tipo in ('calle_cerrada','falla_mecanica','desvio','congestion','otro')),
  descripcion text,
  ubicacion   geography(Point, 4326),
  activa      boolean not null default true,
  creada_at   timestamptz not null default now(),
  resuelta_at timestamptz,
  -- 'otro' es una observación libre del conductor: sin texto no dice nada.
  constraint incidencias_otro_con_descripcion
    check (tipo <> 'otro' or nullif(btrim(descripcion), '') is not null)
);

create index incidencias_ubicacion_gix on incidencias using gist (ubicacion);
create index incidencias_activas_idx on incidencias (ruta_id) where activa;
