-- ============================================================
-- Funciones de consulta
-- Corre después de 01_schema.sql.
--
-- Todas devuelven coordenadas separadas en lat/lng en vez de la geografía cruda:
-- el cliente dibuja con Leaflet, que espera pares [lat, lng] y no entiende el
-- formato binario de PostGIS. La conversión se hace una vez aquí y no en cada
-- pantalla.
-- ============================================================

-- ── PARADAS CERCANAS AL CIUDADANO ──
--
-- La cercanía la resuelve PostGIS con el índice GiST sobre paradas.ubicacion: el
-- cliente recibe solo el resultado en vez de descargar todas las paradas para
-- medirlas, lo que no escala y gasta datos móviles.
--
-- security invoker: respeta las políticas RLS de lectura pública, así que el
-- ciudadano la llama sin autenticarse y no ve nada que no pudiera ver
-- consultando las tablas directamente.
create or replace function paradas_cercanas(
  lat            double precision,
  lng            double precision,
  radio_max_m    integer default 1500,
  limite         integer default 5
)
returns table (
  parada_id        uuid,
  parada_nombre    text,
  parada_lat       double precision,
  parada_lng       double precision,
  radio_geocerca_m integer,
  distancia_m      double precision,
  ruta_id          uuid,
  ruta_nombre      text,
  ruta_tipo        text,
  ruta_icono       text,
  ruta_color       text
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    p.id,
    p.nombre,
    ST_Y(p.ubicacion::geometry),
    ST_X(p.ubicacion::geometry),
    p.radio_geocerca_m,
    ST_Distance(p.ubicacion, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography),
    r.id,
    r.nombre,
    r.tipo,
    r.icono,
    r.color
  from paradas p
  join rutas r on r.id = p.ruta_id
  where r.activa
    and ST_DWithin(
          p.ubicacion,
          ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
          radio_max_m
        )
  order by p.ubicacion <-> ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
  limit limite;
$$;


-- ── UNIDADES QUE VIENEN HACIA UNA PARADA ──
--
-- Devuelve la antigüedad de la última señal, no un estado ya interpretado: el
-- umbral de "sin señal" es calibrable y vive en la tabla parametros, así que
-- decidirlo aquí lo congelaría.
--
-- `ruta_tiene_trazado` existe para que la interfaz sepa si puede prometer un
-- tiempo estimado: sin trazado la distancia iría en línea recta y subestimaría
-- siempre.
create or replace function llegadas_a_parada(parada uuid)
returns table (
  unidad_id          uuid,
  unidad_nombre      text,
  unidad_lat         double precision,
  unidad_lng         double precision,
  viaje_id           uuid,
  segundos_sin_senal integer,
  distancia_recta_m  double precision,
  ultima_parada      text,
  ruta_id            uuid,
  ruta_nombre        text,
  ruta_color         text,
  ruta_icono         text,
  ruta_tiene_trazado boolean
)
language sql
stable
security invoker
set search_path = public
as $$
  with objetivo as (
    select p.id, p.ubicacion, p.ruta_id
    from paradas p
    where p.id = parada
  )
  select
    u.id,
    u.nombre,
    ST_Y(pos.ubicacion::geometry),
    ST_X(pos.ubicacion::geometry),
    v.id,
    case
      when pos.capturado_at is null then null
      else extract(epoch from (now() - pos.capturado_at))::integer
    end,
    case
      when pos.ubicacion is null then null
      else ST_Distance(pos.ubicacion, o.ubicacion)
    end,
    ult.nombre,
    r.id,
    r.nombre,
    r.color,
    r.icono,
    r.trazado is not null
  from objetivo o
  join rutas r on r.id = o.ruta_id and r.activa
  join unidades u on u.ruta_id = r.id and u.activa
  left join viajes v on v.unidad_id = u.id and v.finalizado_at is null
  left join lateral (
    select p2.velocidad_kmh, p2.ubicacion, p2.capturado_at
    from posiciones p2
    where p2.unidad_id = u.id and p2.usable
    order by p2.capturado_at desc
    limit 1
  ) pos on true
  left join lateral (
    select p3.nombre
    from eventos_geocerca e
    join paradas p3 on p3.id = e.parada_id
    where e.viaje_id = v.id
    order by e.entro_at desc
    limit 1
  ) ult on true
  order by v.id is null, pos.capturado_at desc nulls last;
$$;


-- ── ESTADO ACTUAL DE LA FLOTA (monitoreo del admin) ──
--
-- Cruza unidades, rutas, dispositivos y la última posición con un lateral join en
-- vez de traer todas las posiciones al cliente: `posiciones` es la tabla de alta
-- escritura y crece sin parar. El índice posiciones_unidad_tiempo_idx
-- (unidad_id, capturado_at desc) hace que cada lateral sea una sola lectura.
create or replace function estado_flota()
returns table (
  unidad_id             uuid,
  unidad_nombre         text,
  unidad_lat            double precision,
  unidad_lng            double precision,
  ruta_id               uuid,
  ruta_nombre           text,
  ruta_color            text,
  ruta_icono            text,
  viaje_id              uuid,
  en_recorrido          boolean,
  velocidad_kmh         numeric,
  capturado_at          timestamptz,
  segundos_sin_senal    integer,
  bateria_pct           integer,
  dispositivo_vinculado boolean
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    u.id,
    u.nombre,
    ST_Y(p.ubicacion::geometry),
    ST_X(p.ubicacion::geometry),
    r.id,
    r.nombre,
    r.color,
    r.icono,
    v.id,
    v.id is not null,
    p.velocidad_kmh,
    p.capturado_at,
    case
      when p.capturado_at is null then null
      else extract(epoch from (now() - p.capturado_at))::integer
    end,
    d.ultima_bateria,
    coalesce(d.vinculado, false)
  from unidades u
  left join rutas r on r.id = u.ruta_id
  left join dispositivos d on d.unidad_id = u.id
  left join viajes v on v.unidad_id = u.id and v.finalizado_at is null
  left join lateral (
    select pos.velocidad_kmh, pos.ubicacion, pos.capturado_at
    from posiciones pos
    where pos.unidad_id = u.id and pos.usable
    order by pos.capturado_at desc
    limit 1
  ) p on true
  where u.activa
  order by v.id is null, u.nombre;
$$;


-- ── GEOMETRÍA DE LAS RUTAS PARA EL MAPA ──
--
-- El trazado sale como GeoJSON porque es lo único que Leaflet sabe leer sin
-- convertir. Se devuelve en coordenadas [lng, lat] —el orden de GeoJSON—, y el
-- cliente las invierte al dibujar.
--
-- Las rutas sin trazado se incluyen igual: el admin necesita verlas listadas para
-- saber cuáles le faltan por dibujar.
create or replace function rutas_para_mapa()
returns table (
  ruta_id         uuid,
  ruta_nombre     text,
  ruta_color      text,
  ruta_icono      text,
  trazado_geojson jsonb
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    r.id,
    r.nombre,
    r.color,
    r.icono,
    case
      when r.trazado is null then null
      else ST_AsGeoJSON(r.trazado::geometry)::jsonb
    end
  from rutas r
  where r.activa
  order by r.nombre;
$$;


-- ── PARADAS DE UNA RUTA (editor y detalle) ──
create or replace function paradas_de_ruta(ruta uuid)
returns table (
  parada_id        uuid,
  parada_nombre    text,
  orden            integer,
  parada_lat       double precision,
  parada_lng       double precision,
  radio_geocerca_m integer,
  notifica         boolean
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    p.id,
    p.nombre,
    p.orden,
    ST_Y(p.ubicacion::geometry),
    ST_X(p.ubicacion::geometry),
    p.radio_geocerca_m,
    p.notifica
  from paradas p
  where p.ruta_id = ruta
  order by p.orden;
$$;


-- ── ESCRITURA DESDE EL EDITOR DE RUTAS ──
--
-- La geometría se construye en SQL y no en el cliente: así el único lugar que
-- sabe cómo se arma un LineString 4326 es la base, y un cliente equivocado no
-- puede guardar una geometría inválida.
--
-- Sin `with check` explícito la política de admin de RLS ya rechaza la escritura
-- a quien no tenga el rol, porque estas funciones son security invoker.
create or replace function guardar_trazado_de_ruta(
  ruta         uuid,
  coordenadas  jsonb
)
returns void
language sql
volatile
security invoker
set search_path = public
as $$
  update rutas
  set trazado = case
    -- Menos de dos puntos no es una línea: se interpreta como "borrar el trazado".
    when jsonb_array_length(coordenadas) < 2 then null
    else ST_SetSRID(
           ST_MakeLine(
             array(
               select ST_MakePoint(
                        (punto ->> 0)::double precision,
                        (punto ->> 1)::double precision
                      )
               from jsonb_array_elements(coordenadas) as punto
             )
           ),
           4326
         )::geography
  end
  where id = ruta;
$$;


-- El parametro lleva sufijo para no chocar con la columna homonima: `nombre` a secas
-- se resolvia como paradas.nombre y, al haber un max(), Postgres exigia un GROUP BY.
create or replace function crear_parada(
  ruta           uuid,
  nombre_parada  text,
  lat            double precision,
  lng            double precision,
  radio_m        integer
)
returns uuid
language sql
volatile
security invoker
set search_path = public
as $$
  insert into paradas (ruta_id, nombre, orden, ubicacion, radio_geocerca_m)
  values (
    ruta,
    nombre_parada,
    (select coalesce(max(p.orden), 0) + 1 from paradas p where p.ruta_id = ruta),
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
    radio_m
  )
  returning id;
$$;


create or replace function mover_parada(
  parada  uuid,
  lat     double precision,
  lng     double precision,
  radio_m integer
)
returns void
language sql
volatile
security invoker
set search_path = public
as $$
  update paradas
  set ubicacion = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radio_geocerca_m = radio_m
  where id = parada;
$$;
