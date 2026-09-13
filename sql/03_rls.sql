-- ============================================================
-- Row Level Security
-- El ciudadano NO se autentica: lectura publica.
-- El dispositivo solo escribe SU propia unidad.
-- ============================================================

alter table rutas            enable row level security;
alter table paradas          enable row level security;
alter table unidades         enable row level security;
alter table dispositivos     enable row level security;
alter table viajes           enable row level security;
alter table posiciones       enable row level security;
alter table eventos_geocerca enable row level security;
alter table incidencias      enable row level security;
alter table parametros       enable row level security;


-- ── LECTURA PUBLICA (el ciudadano no inicia sesion) ──
create policy publico_lee_rutas on rutas
  for select using (activa);

create policy publico_lee_paradas on paradas
  for select using (true);

create policy publico_lee_unidades on unidades
  for select using (activa);

create policy publico_lee_posiciones on posiciones
  for select using (usable);

-- Sin esto el ciudadano no distingue "va en camino" de "no hay recorrido activo":
-- el join a viajes le devuelve vacio y toda unidad parece detenida.
create policy publico_lee_viajes on viajes
  for select using (true);

create policy publico_lee_incidencias on incidencias
  for select using (activa);

-- La web del ciudadano usa los mismos umbrales que el servidor: sin lectura publica
-- tendria que quemarlos en el codigo y dejarian de coincidir. Escribirlos sigue siendo
-- exclusivo del administrador.
create policy publico_lee_parametros on parametros
  for select using (true);


-- ── QUIÉN ES QUIÉN ──
--
-- Supabase NO expone los claims personalizados en la raíz del JWT: viven dentro de
-- app_metadata. Leer `auth.jwt() ->> 'rol'` devolvia siempre null, y con eso ninguna
-- politica de admin llegaba a concederse nunca.
--
-- app_metadata solo se escribe desde el servidor. user_metadata no sirve: el propio
-- usuario puede editarlo y se auto-nombraria administrador.
create or replace function es_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'rol', '') = 'admin';
$$;

create or replace function unidad_del_dispositivo()
returns uuid
language sql
stable
security invoker
set search_path = public
as $$
  select nullif(auth.jwt() -> 'app_metadata' ->> 'unidad_id', '')::uuid;
$$;


-- ── DISPOSITIVO: solo escribe SU propia unidad ──
create policy dispositivo_escribe_posicion on posiciones
  for insert with check (
    unidad_id = unidad_del_dispositivo()
  );

create policy dispositivo_gestiona_viaje on viajes
  for all using (unidad_id = unidad_del_dispositivo())
  with check (unidad_id = unidad_del_dispositivo());

create policy dispositivo_reporta_incidencia on incidencias
  for insert with check (
    unidad_id = unidad_del_dispositivo()
  );


-- ── ADMIN: acceso completo ──
create policy admin_total_rutas on rutas
  for all using (es_admin()) with check (es_admin());

create policy admin_total_paradas on paradas
  for all using (es_admin()) with check (es_admin());

create policy admin_total_unidades on unidades
  for all using (es_admin()) with check (es_admin());

create policy admin_total_dispositivos on dispositivos
  for all using (es_admin()) with check (es_admin());

create policy admin_total_viajes on viajes
  for all using (es_admin()) with check (es_admin());

create policy admin_total_posiciones on posiciones
  for all using (es_admin()) with check (es_admin());

create policy admin_total_eventos on eventos_geocerca
  for all using (es_admin()) with check (es_admin());

create policy admin_total_incidencias on incidencias
  for all using (es_admin()) with check (es_admin());

create policy admin_total_parametros on parametros
  for all using (es_admin()) with check (es_admin());
