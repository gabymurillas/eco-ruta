-- ============================================================
-- Soporte SQL de la evaluación de geocercas
-- Corre después de 01_schema.sql y 04_funciones.sql.
--
-- La Edge Function `registrar-posicion` decide qué escribir; estas funciones le
-- dan lo que necesita para decidirlo, en una sola ida a la base cada una. La
-- parte geoespacial se resuelve aquí porque es donde está el índice GiST: traer
-- las paradas al runtime para medirlas en TypeScript recorrería la tabla entera
-- por cada posición, y `posiciones` es la tabla de alta escritura.
-- ============================================================


-- ── LECTURAS PARA EL SUAVIZADO ──
--
-- Devuelve las últimas posiciones usables DEL VIAJE, de la más reciente a la más
-- vieja. El límite lo pone quien llama porque el tamaño de la ventana de
-- suavizado es una decisión del dominio, no del esquema.
--
-- Acotar al viaje y no a la unidad no es un detalle: la unidad conserva las
-- posiciones de todos sus recorridos anteriores, y promediar la lectura actual
-- con una de ayer arrastraría el punto suavizado cientos de metros hacia donde
-- estuvo el vehículo la última vez. Un viaje, en cambio, es una corrida
-- continua. Cuando el teléfono descarga un buffer offline, las tres últimas del
-- viaje son contiguas en el tiempo, que es justo lo que el suavizado necesita.
--
-- security definer: la llama la Edge Function con service_role, que ya pasa por
-- encima de RLS; se declara explícito para que no dependa de quién la invoque.
create or replace function posiciones_para_suavizar(viaje uuid, limite integer)
returns table (
  lat          double precision,
  lng          double precision,
  exactitud_m  numeric,
  capturado_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ST_Y(p.ubicacion::geometry),
    ST_X(p.ubicacion::geometry),
    p.exactitud_m,
    p.capturado_at
  from posiciones p
  where p.viaje_id = posiciones_para_suavizar.viaje
    and p.usable
  order by p.capturado_at desc
  limit posiciones_para_suavizar.limite;
$$;

revoke execute on function posiciones_para_suavizar(uuid, integer) from public, anon, authenticated;
grant execute on function posiciones_para_suavizar(uuid, integer) to service_role;


-- ── ESTADO DE CADA PARADA DEL VIAJE ──
--
-- Por cada parada de la ruta del viaje: si el punto suavizado cae dentro de SU
-- radio —cada parada tiene el suyo, una esquina angosta no necesita el mismo que
-- un terminal— y el evento que ya tenga en este viaje, si lo tiene.
--
-- Devuelve todas las paradas, no solo las de dentro: el algoritmo necesita ver
-- las de fuera para detectar salidas. Filtrarlas aquí haría que una unidad que
-- se aleja nunca registrara su salida.
--
-- `dentro_aproximacion` y los `avisado_*` alimentan los avisos al ciudadano
-- (ver `_dominio/avisos.ts`). El radio de aproximación entra como argumento y
-- no se lee aquí de `parametros`: la Edge Function ya leyó los umbrales, y así
-- todo lo calibrable llega por el mismo camino.
--
-- El drop es necesario para volver a correr el archivo: cambiaron los
-- argumentos y el tipo de retorno, y `create or replace` no admite ninguno.
drop function if exists estado_de_geocercas(uuid, double precision, double precision);
drop function if exists estado_de_geocercas(uuid, double precision, double precision, integer);

create function estado_de_geocercas(
  viaje                uuid,
  lat                  double precision,
  lng                  double precision,
  radio_aproximacion_m integer
)
returns table (
  parada_id            uuid,
  parada_nombre        text,
  notifica             boolean,
  dentro               boolean,
  dentro_aproximacion  boolean,
  entro_at             timestamptz,
  notificado_at        timestamptz,
  salio_at             timestamptz,
  avisado_acercamiento boolean,
  avisado_paso         boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with punto as (
    select ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography as ubicacion
  )
  select
    p.id,
    p.nombre,
    p.notifica,
    ST_DWithin(p.ubicacion, punto.ubicacion, p.radio_geocerca_m),
    ST_DWithin(p.ubicacion, punto.ubicacion, estado_de_geocercas.radio_aproximacion_m),
    e.entro_at,
    e.notificado_at,
    e.salio_at,
    exists (
      select 1 from avisos_parada a
      where a.viaje_id = v.id and a.parada_id = p.id and a.tipo = 'acercandose'
    ),
    exists (
      select 1 from avisos_parada a
      where a.viaje_id = v.id and a.parada_id = p.id and a.tipo = 'paso'
    )
  from viajes v
  cross join punto
  join paradas p on p.ruta_id = v.ruta_id
  left join eventos_geocerca e
    on e.viaje_id = v.id
   and e.parada_id = p.id
  where v.id = estado_de_geocercas.viaje
    and v.finalizado_at is null
  order by p.orden;
$$;

revoke execute on function estado_de_geocercas(uuid, double precision, double precision, integer)
  from public, anon, authenticated;
grant execute on function estado_de_geocercas(uuid, double precision, double precision, integer)
  to service_role;
