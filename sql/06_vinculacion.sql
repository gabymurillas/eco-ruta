-- ============================================================
-- Canje del código de vinculación del dispositivo
-- Corre después de 01_schema.sql.
--
-- Estas funciones no las llama ningún cliente: las llama la Edge Function
-- `vincular-dispositivo` con la clave service_role. Están separadas de
-- 04_funciones.sql porque aquellas son consultas de lectura con security
-- invoker, y estas escriben con security definer.
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
create or replace function registrar_salud_del_dispositivo(bateria integer default null)
returns void
language sql
volatile
security definer
set search_path = public
as $$
  update dispositivos d
     set ultima_bateria  = coalesce(registrar_salud_del_dispositivo.bateria, d.ultima_bateria),
         ultima_senal_at = now()
   where d.unidad_id = unidad_del_dispositivo();
$$;

revoke execute on function registrar_salud_del_dispositivo(integer) from public, anon;
grant execute on function registrar_salud_del_dispositivo(integer) to authenticated;
