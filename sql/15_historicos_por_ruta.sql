-- ============================================================
-- 15 · Históricos por ruta
--
-- 1. `viajes_por_dia` entra al repositorio (cierra TS-08) con dos arreglos:
--    - El día se corta en la hora de Caracas. Con `date_trunc` sobre UTC, un
--      viaje de las 9 p. m. caía en el día siguiente.
--    - Solo cuenta viajes cerrados, igual que el indicador «Viajes
--      completados»: el gráfico y la cifra de arriba suman lo mismo.
-- 2. `resumen_por_ruta`: los mismos indicadores de `resumen_historicos`,
--    separados por ruta, más cuántas incidencias del período siguen activas.
--
-- Mismas firmas de retorno que en producción: `create or replace` basta.
-- ============================================================

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
  where v.iniciado_at >= now() - make_interval(days => dias)
    and v.finalizado_at is not null
  group by 1, 2, 3, 4
  order by 1, 3;
$$;


-- La cobertura se define igual que en 05_consultas_historicos.sql: paradas
-- planificadas por viaje (vista paradas_por_ruta) contra eventos de geocerca.
-- Aparecen las rutas activas y cualquier ruta inactiva que tuvo actividad en
-- el período, para que desactivar una ruta no borre lo que hizo.
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
  with rango as (
    select now() - make_interval(days => dias) as desde
  ),
  viajes_periodo as (
    select v.* from viajes v, rango where v.iniciado_at >= rango.desde
  ),
  cerrados as (
    select
      v.ruta_id,
      count(*) as viajes,
      round(avg(extract(epoch from (v.finalizado_at - v.iniciado_at)) / 60)::numeric, 1) as duracion
    from viajes_periodo v
    where v.finalizado_at is not null
    group by 1
  ),
  planificadas as (
    select v.ruta_id, v.id as viaje_id, pr.parada_id
    from viajes_periodo v
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
    from incidencias i, rango
    where i.creada_at >= rango.desde
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
  left join cerrados c   on c.ruta_id = r.id
  left join cobertura cb on cb.ruta_id = r.id
  left join inc          on inc.ruta_id = r.id
  where r.activa or c.ruta_id is not null or cb.ruta_id is not null or inc.ruta_id is not null
  order by coalesce(c.viajes, 0) desc, r.nombre;
$$;
