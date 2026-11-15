-- ============================================================
-- 18 · Desvincular el teléfono sin borrar la unidad (ADM-12, brecha TS-04)
--
-- Hasta aquí, cortar el acceso de un teléfono exigía `eliminar_unidad`, que se
-- lleva también los viajes, las posiciones y los avisos de la unidad. Y generar un
-- código nuevo no lo cortaba: el canje reutiliza la cuenta de Auth y solo cambia
-- su contraseña, así que el teléfono viejo conservaba su refresh token.
--
-- `desvincular_dispositivo` corta el acceso y conserva el historial. Para que un
-- código nuevo no deje al teléfono anterior conectado, el panel ya no genera
-- códigos sobre una unidad vinculada: primero se desvincula (ver
-- unidades.service.ts).
--
-- También se reescribe el mensaje del latido revocado: ya no implica que la unidad
-- se borró. El código `dispositivo_revocado` y el 401 no cambian, así que la app
-- no necesita nada nuevo (ver docs/contrato-vinculacion.md).
--
-- Corre después de 17. Es idempotente: se puede volver a aplicar.
-- ============================================================


-- ── DESVINCULAR ──
--
-- Una sola función, y no varias llamadas desde la web, para que sea atómico: si
-- borrar la cuenta falla, nada cambia.
--
-- Qué hace, en orden:
--   · Cierra el viaje abierto de la unidad. Sin teléfono nadie lo va a finalizar,
--     y un viaje abierto es justo lo que hace visible a una unidad para el público
--     (ADR-0012): quedaría en el mapa, quieta en su última posición, para siempre.
--   · Borra la fila de `dispositivos`. Con ella se van el código pendiente, la
--     batería y la última señal, que eran de ese equipo y no de la unidad. Y sin
--     fila, el latido del teléfono responde 401 (`dispositivo_revocado`).
--   · Borra la cuenta de Auth del teléfono, con sus sesiones y su refresh token.
--     `registrar-posicion` valida el token contra Auth en cada llamada, así que
--     deja de aceptar posiciones en ese momento.
--
-- Qué NO toca: la unidad, sus viajes, posiciones, eventos de geocerca y avisos.
--
-- Lo que queda abierto: el token de acceso que el teléfono ya tenía vale hasta una
-- hora para escribir directo por PostgREST (RLS lee el `unidad_id` del token, no
-- consulta la cuenta). Es el mismo margen que deja `eliminar_unidad`, y el latido
-- lo acorta: al primer 401 la app borra sus credenciales.
--
-- security definer porque `auth.users` no es accesible para `authenticated`. Por
-- eso mismo verifica que quien llama sea administrador: el operador solo mira.
create or replace function desvincular_dispositivo(unidad uuid)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  cuenta_del_dispositivo uuid;
begin
  if not es_admin() then
    raise exception 'Solo un administrador puede desvincular teléfonos.'
      using errcode = '42501';
  end if;

  delete from dispositivos d
   where d.unidad_id = desvincular_dispositivo.unidad
  returning d.auth_user_id into cuenta_del_dispositivo;

  if not found then
    raise exception 'Esta unidad no tiene un teléfono vinculado.' using errcode = 'P0002';
  end if;

  update viajes v
     set finalizado_at = now()
   where v.unidad_id = desvincular_dispositivo.unidad
     and v.finalizado_at is null;

  if cuenta_del_dispositivo is not null then
    delete from auth.users au where au.id = cuenta_del_dispositivo;
  end if;
end;
$$;

revoke execute on function desvincular_dispositivo(uuid) from public, anon;
grant execute on function desvincular_dispositivo(uuid) to authenticated;


-- ── LATIDO: mensaje del 401 ──
--
-- Igual que en 06_vinculacion.sql salvo el mensaje: ahora el dispositivo también
-- se revoca sin que la unidad desaparezca.
create or replace function registrar_salud_del_dispositivo(bateria integer default null)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  update dispositivos d
     set ultima_bateria  = coalesce(registrar_salud_del_dispositivo.bateria, d.ultima_bateria),
         ultima_senal_at = now()
   where d.unidad_id = unidad_del_dispositivo();

  if not found then
    raise sqlstate 'PGRST' using
      message = '{"code":"dispositivo_revocado","message":"Este teléfono ya no está vinculado a la unidad."}',
      detail  = '{"status":401,"headers":{}}';
  end if;
end;
$$;

revoke execute on function registrar_salud_del_dispositivo(integer) from public, anon;
grant execute on function registrar_salud_del_dispositivo(integer) to authenticated;
