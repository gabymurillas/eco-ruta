-- ============================================================
-- 17 · Roles del panel: operador (ADR-0015)
--
-- Hasta aquí el panel tenía un solo rol, `admin`, con acceso completo. Se agrega
-- `operador`: mira todo lo que mira el admin (monitoreo, rutas, paradas, unidades,
-- históricos) y atiende incidencias; no crea, edita ni borra nada más.
--
-- El rol sigue viviendo en `app_metadata.rol` del JWT (ver 03_rls.sql): solo lo
-- escribe el servidor, con la Edge Function `gestionar-equipo`.
--
-- Qué NO cambia, a propósito:
--   · `es_admin()` y las políticas `admin_total_*`: el admin conserva todo.
--   · Las funciones de escritura (`guardar_trazado_de_ruta`, `crear_parada`,
--     `mover_parada`) son security invoker: al operador lo frena RLS, sin tocarlas.
--   · `eliminar_unidad` (security definer) ya exige `es_admin()`.
--   · Las funciones de lectura son security invoker: al operador le alcanzan las
--     políticas de lectura de abajo.
--
-- Corre después de 16. Es idempotente: se puede volver a aplicar.
-- ============================================================


-- ── QUIÉN ES QUIÉN ──
create or replace function es_operador()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'rol', '') = 'operador';
$$;


-- ── OPERADOR: lectura ──
--
-- Lo mismo que ve el admin, sin los filtros de la lectura pública: rutas
-- inactivas, viajes terminados, posiciones descartadas e incidencias resueltas.
-- Sin eso los históricos y el detalle de una incidencia le saldrían vacíos.
--
-- `parametros` no necesita política: su lectura ya es pública.
drop policy if exists operador_lee_rutas on rutas;
create policy operador_lee_rutas on rutas
  for select using (es_operador());

drop policy if exists operador_lee_paradas on paradas;
create policy operador_lee_paradas on paradas
  for select using (es_operador());

drop policy if exists operador_lee_unidades on unidades;
create policy operador_lee_unidades on unidades
  for select using (es_operador());

drop policy if exists operador_lee_viajes on viajes;
create policy operador_lee_viajes on viajes
  for select using (es_operador());

drop policy if exists operador_lee_posiciones on posiciones;
create policy operador_lee_posiciones on posiciones
  for select using (es_operador());

drop policy if exists operador_lee_eventos on eventos_geocerca;
create policy operador_lee_eventos on eventos_geocerca
  for select using (es_operador());

drop policy if exists operador_lee_avisos on avisos_parada;
create policy operador_lee_avisos on avisos_parada
  for select using (es_operador());

drop policy if exists operador_lee_incidencias on incidencias;
create policy operador_lee_incidencias on incidencias
  for select using (es_operador());

-- El operador necesita la salud del teléfono (vinculado, batería, última señal)
-- para monitorear, pero NO el código de vinculación: quien lo lee puede atar un
-- teléfono propio a la unidad y transmitir en su nombre. RLS filtra filas, no
-- columnas, así que se le esconde la fila entera mientras tenga un código. No
-- pierde nada: al generarse un código la unidad queda `vinculado = false`, y una
-- unidad sin fila de dispositivo se muestra igual, como «sin vincular».
drop policy if exists operador_lee_dispositivos on dispositivos;
create policy operador_lee_dispositivos on dispositivos
  for select using (es_operador() and codigo_vinculacion is null);


-- ── OPERADOR: atender incidencias ──
--
-- La política deja pasar el update; el disparador de abajo decide qué columnas.
drop policy if exists operador_atiende_incidencias on incidencias;
create policy operador_atiende_incidencias on incidencias
  for update using (es_operador()) with check (es_operador());

-- RLS filtra filas, no columnas: con solo la política, el operador podría reescribir
-- la descripción, el tipo o la ruta de una incidencia ajena. `grant update (columna)`
-- no sirve porque el admin comparte el rol `authenticated` (mismo motivo que el
-- latido en 06_vinculacion.sql). El disparador compara la fila vieja con la nueva y
-- solo le permite cambiar el estado: `activa` y `resuelta_at`.
--
-- security invoker: lee el JWT de quien hace el update. Al admin, a los
-- dispositivos y a service_role no los afecta.
create or replace function incidencias_solo_estado_para_operador()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if es_operador()
     and (to_jsonb(new) - 'activa' - 'resuelta_at') is distinct from
         (to_jsonb(old) - 'activa' - 'resuelta_at') then
    raise exception 'Un operador solo puede cambiar el estado de una incidencia.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists incidencias_solo_estado_para_operador on incidencias;
create trigger incidencias_solo_estado_para_operador
  before update on incidencias
  for each row execute function incidencias_solo_estado_para_operador();
