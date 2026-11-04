-- ============================================================
-- Vinculación del dispositivo: canje del código, latido y revocación
-- Corre después de 01_schema.sql y 03_rls.sql. Es idempotente.
--
-- El canje y el registro de la cuenta los llama solo la Edge Function
-- `vincular-dispositivo` con la clave service_role; el latido, el teléfono; y
-- `eliminar_unidad`, el admin. Están separadas de 04_funciones.sql porque
-- aquellas son consultas de lectura con security invoker, y estas escriben con
-- security definer.
-- ============================================================


-- ── CANJE ──
--
-- Es un único `update ... returning` a propósito. Leer el código y después
-- marcarlo como usado en dos sentencias deja una ventana en la que dos
-- teléfonos canjean el mismo código: ambos leerían la fila vigente antes de
-- que cualquiera la invalide. Con un solo update, el segundo no encuentra
-- fila y recibe 401.
--
-- El código se borra al canjearse porque es de un solo uso. Que venza en
-- minutos no basta: dentro de esa ventana serviría varias veces.
--
-- Devuelve `ruta_id` para que la app pueda abrir un viaje sin una consulta
-- extra. Ojo: es la ruta al momento de vincular. Si el admin reasigna la unidad
-- a otra ruta, un valor guardado en el teléfono queda viejo.
--
-- security definer porque el teléfono todavía no está autenticado cuando
-- llama, así que no hay política RLS que pueda dejarlo pasar. Por eso mismo
-- se le revoca execute a anon y authenticated: si cualquiera pudiera
-- invocarla, tendría un oráculo para probar códigos por fuerza bruta.
-- El drop es necesario para que este archivo se pueda volver a correr sobre una
-- base ya migrada: `create or replace` no admite cambiar el tipo de retorno, y
-- este cambió al agregarse `ruta_id`.
drop function if exists canjear_codigo_de_vinculacion(text);

create function canjear_codigo_de_vinculacion(codigo text)
returns table (
  unidad_id     uuid,
  unidad_nombre text,
  ruta_id       uuid,
  ruta_nombre   text,
  auth_user_id  uuid
)
language sql
security definer
set search_path = public
as $$
  with canjeado as (
    update dispositivos d
       set codigo_vinculacion = null,
           codigo_expira_at   = null,
           vinculado          = true,
           vinculado_at       = now()
     where d.codigo_vinculacion = upper(trim(canjear_codigo_de_vinculacion.codigo))
       and d.codigo_expira_at > now()
    returning d.unidad_id, d.auth_user_id
  )
  select c.unidad_id, u.nombre, r.id, r.nombre, c.auth_user_id
    from canjeado c
    join unidades u on u.id = c.unidad_id
    left join rutas r on r.id = u.ruta_id;
$$;

revoke execute on function canjear_codigo_de_vinculacion(text) from public, anon, authenticated;
grant execute on function canjear_codigo_de_vinculacion(text) to service_role;


-- ── REGISTRO DE LA CUENTA DEL DISPOSITIVO ──
--
-- Guarda qué usuario de Auth quedó asociado a la unidad, para que una
-- revinculación reutilice la cuenta en vez de acumular una por cada código
-- canjeado.
create or replace function registrar_auth_de_dispositivo(unidad uuid, usuario uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update dispositivos d
     set auth_user_id = registrar_auth_de_dispositivo.usuario
   where d.unidad_id = registrar_auth_de_dispositivo.unidad;
$$;

revoke execute on function registrar_auth_de_dispositivo(uuid, uuid) from public, anon, authenticated;
grant execute on function registrar_auth_de_dispositivo(uuid, uuid) to service_role;


-- ── LATIDO DEL DISPOSITIVO ──
--
-- No se resuelve con una política de RLS sobre `dispositivos`. RLS filtra filas,
-- no columnas: una política `using (unidad_id = unidad_del_dispositivo())` dejaría
-- al teléfono escribir cualquier columna de su propia fila, incluidas
-- codigo_vinculacion, codigo_expira_at y auth_user_id. Un equipo comprometido
-- podría emitirse un código de vinculación con vencimiento lejano.
--
-- Restringir columnas exige `grant update (columna)`, y eso tampoco sirve aquí:
-- el administrador es también rol `authenticated`, así que revocarle el update
-- completo a ese rol rompería la generación de códigos desde el panel.
--
-- Con security definer, las columnas que se tocan quedan fijas en el cuerpo y no
-- las elige quien llama.
--
-- `ultima_senal_at` es now() del servidor, no un valor del cliente: un teléfono
-- barato que estuvo desenchufado suele arrancar con la hora corrida, y esa
-- columna es la que decide si el admin marca la unidad como sin señal.
--
-- La unidad sale del JWT, nunca de un parámetro: así no hay forma de escribir el
-- latido de otra unidad.
--
-- Si la unidad del token ya no tiene dispositivo —porque se eliminó—, responde
-- 401 en vez de actualizar cero filas en silencio.
--
-- El latido corre siempre, haya viaje o no, así que es lo primero que se entera.
-- Con el 401 la app intenta renovar el token, Auth lo rechaza porque la cuenta ya
-- no existe, y la app borra sus credenciales y vuelve a la pantalla de
-- vinculación (ver docs/contrato-vinculacion.md). Sin esto, el teléfono seguiría
-- hasta una hora con el token de acceso que ya tenía.
--
-- El SQLSTATE 'PGRST' es la forma en que PostgREST deja a una función elegir el
-- código HTTP de la respuesta: el mensaje y el detalle van como JSON.
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
      message = '{"code":"dispositivo_revocado","message":"La unidad de este dispositivo ya no existe."}',
      detail  = '{"status":401,"headers":{}}';
  end if;
end;
$$;

revoke execute on function registrar_salud_del_dispositivo(integer) from public, anon;
grant execute on function registrar_salud_del_dispositivo(integer) to authenticated;


-- ── ELIMINAR UNIDAD ──
--
-- Una sola función, y no dos llamadas desde la web, para que sea atómico: si
-- borrar la cuenta falla, la unidad tampoco se borra, y no queda un teléfono con
-- sesión apuntando a una unidad inexistente.
--
-- Borrar el usuario de `auth.users` arrastra sus sesiones y sus refresh tokens:
-- el teléfono ya no puede renovar el token. El token de acceso que tenga vale
-- hasta una hora más; de eso se encarga el latido (arriba).
--
-- El borrado de la unidad arrastra, por las claves foráneas de 01_schema.sql, su
-- dispositivo, sus viajes, posiciones, eventos de geocerca y avisos. Las
-- incidencias se conservan con `unidad_id` nulo.
--
-- security definer porque `auth.users` no es accesible para `authenticated`. Por
-- eso mismo la función verifica que quien llama sea administrador: sin esa línea,
-- cualquier dispositivo podría borrar unidades.
create or replace function eliminar_unidad(unidad uuid)
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
    raise exception 'Solo un administrador puede eliminar unidades.'
      using errcode = '42501';
  end if;

  select d.auth_user_id
    into cuenta_del_dispositivo
    from dispositivos d
   where d.unidad_id = eliminar_unidad.unidad;

  delete from unidades u where u.id = eliminar_unidad.unidad;

  if not found then
    raise exception 'La unidad no existe.' using errcode = 'P0002';
  end if;

  if cuenta_del_dispositivo is not null then
    delete from auth.users au where au.id = cuenta_del_dispositivo;
  end if;
end;
$$;

revoke execute on function eliminar_unidad(uuid) from public, anon;
grant execute on function eliminar_unidad(uuid) to authenticated;
