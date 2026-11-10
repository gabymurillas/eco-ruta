-- ============================================================
-- 16 · Históricos: período por días completos y cobertura de viajes cerrados
--
-- Corrige dos defectos de 04 y 15, encontrados en revisión:
--
-- 1. El período era una ventana móvil (`now() - N días`): con N = 7 arrancaba
--    a esta misma hora de hace 7 días. El gráfico muestra 7 días completos en
--    hora de Caracas, así que los viajes de esa tarde suelta contaban en los
--    indicadores pero no tenían barra. Ahora el período empieza a la medianoche
--    de Caracas de hace N − 1 días: lo mismo que dibuja el gráfico.
-- 2. La cobertura planificaba paradas también para viajes abiertos o
--    abandonados, mientras «Viajes completados» solo cuenta los cerrados. Una
--    ruta con un solo viaje en curso salía con 0 viajes y cobertura del 20 %.
--
-- Además `resumen_historicos` devuelve `incidencias_activas`: así «resueltas»
-- y «activas» salen de la misma consulta, del mismo instante.
-- Cambia la firma de retorno de resumen_historicos: hay que borrarla antes.
-- ============================================================

-- Medianoche de Caracas de hace (dias − 1) días: el primer día del período.
create or replace function inicio_del_periodo(dias integer)
returns timestamptz
language sql
stable
set search_path = public
as $$
  select (((now() at time zone 'America/Caracas')::date - (dias - 1))::timestamp
          at time zone 'America/Caracas');
$$;


drop function if exists resumen_historicos(integer);

create function resumen_historicos(dias integer default 7)
returns table (
  viajes_completados    integer,
  duracion_promedio_min numeric,
  paradas_planificadas  integer,
  paradas_visitadas     integer,
  cobertura_pct         numeric,
  incidencias           integer,
  incidencias_activas   integer
)
language sql
stable
set search_path = public
as $$
  with cerrados as (
    select v.*
    from viajes v
    where v.iniciado_at >= inicio_del_periodo(dias)
      and v.finalizado_at is not null
  ),
  planificadas as (
    select v.id as viaje_id, pr.parada_id
    from cerrados v
    join paradas_por_ruta pr on pr.ruta_id = v.ruta_id
  ),
  visitadas as (
    select e.viaje_id, e.parada_id
    from eventos_geocerca e
    join planificadas pl
      on pl.viaje_id = e.viaje_id and pl.parada_id = e.parada_id
  ),
  inc as (
    select count(*) as total, count(*) filter (where i.activa) as activas
    from incidencias i
    where i.creada_at >= inicio_del_periodo(dias)
  )
  select
    (select count(*) from cerrados)::integer,
    (select round(avg(extract(epoch from (finalizado_at - iniciado_at)) / 60)::numeric, 1) from cerrados),
    (select count(*) from planificadas)::integer,
    (select count(*) from visitadas)::integer,
    (select round(100.0 * (select count(*) from visitadas)
                  / nullif((select count(*) from planificadas), 0), 1)),
    (select total from inc)::integer,
    (select activas from inc)::integer;
$$;


create or replace function viajes_por_dia(dias integer default 7)
returns table (
  dia         date,
  ruta_id     uuid,
  ruta_nombre text,
  ruta_color  text,
  viajes      integer
)
language sql
stable
set search_path = public
as $$
  select
    (v.iniciado_at at time zone 'America/Caracas')::date,
    r.id,
    r.nombre,
    r.color,
    count(*)::integer
  from viajes v
  join rutas r on r.id = v.ruta_id
  where v.iniciado_at >= inicio_del_periodo(dias)
    and v.finalizado_at is not null
  group by 1, 2, 3, 4
  order by 1, 3;
$$;


create or replace function resumen_por_ruta(dias integer default 7)
returns table (
  ruta_id               uuid,
  ruta_nombre           text,
  ruta_color            text,
  viajes_completados    integer,
  duracion_promedio_min numeric,
  paradas_planificadas  integer,
  paradas_visitadas     integer,
  cobertura_pct         numeric,
  incidencias           integer,
  incidencias_activas   integer
)
language sql
stable
set search_path = public
as $$
  with cerrados as (
    select v.*
    from viajes v
    where v.iniciado_at >= inicio_del_periodo(dias)
      and v.finalizado_at is not null
  ),
  por_ruta as (
    select
      v.ruta_id,
      count(*) as viajes,
      round(avg(extract(epoch from (v.finalizado_at - v.iniciado_at)) / 60)::numeric, 1) as duracion
    from cerrados v
    group by 1
  ),
  planificadas as (
    select v.ruta_id, v.id as viaje_id, pr.parada_id
    from cerrados v
    join paradas_por_ruta pr on pr.ruta_id = v.ruta_id
  ),
  cobertura as (
    -- unique (viaje_id, parada_id) en eventos_geocerca: el left join no duplica.
    select pl.ruta_id, count(*) as planificadas, count(e.viaje_id) as visitadas
    from planificadas pl
    left join eventos_geocerca e
      on e.viaje_id = pl.viaje_id and e.parada_id = pl.parada_id
    group by 1
  ),
  inc as (
    select i.ruta_id, count(*) as total, count(*) filter (where i.activa) as activas
    from incidencias i
    where i.creada_at >= inicio_del_periodo(dias)
    group by 1
  )
  select
    r.id,
    r.nombre,
    r.color,
    coalesce(c.viajes, 0)::integer,
    c.duracion,
    coalesce(cb.planificadas, 0)::integer,
    coalesce(cb.visitadas, 0)::integer,
    round(100.0 * cb.visitadas / nullif(cb.planificadas, 0), 1),
    coalesce(inc.total, 0)::integer,
    coalesce(inc.activas, 0)::integer
  from rutas r
  left join por_ruta c   on c.ruta_id = r.id
  left join cobertura cb on cb.ruta_id = r.id
  left join inc          on inc.ruta_id = r.id
  where r.activa or c.ruta_id is not null or inc.ruta_id is not null
  order by coalesce(c.viajes, 0) desc, r.nombre;
$$;
