-- ============================================================
-- Consultas de la pantalla de históricos
-- No crean nada: documentan cómo se calcula cada indicador.
-- ============================================================

-- ── COBERTURA DE PARADAS ──
--
-- Definición: paradas efectivamente visitadas sobre paradas planificadas.
--
--   Planificada: cada parada que toca el trazado de la ruta del viaje
--                (vista paradas_por_ruta), contada una vez por viaje.
--                Si una ruta tiene 3 paradas y hubo 10 viajes, son 30 planificadas.
--   Visitada:    existe un evento de geocerca de ese viaje en esa parada.
--                `eventos_geocerca` tiene unique (viaje_id, parada_id), así que
--                una parada no puede contarse dos veces en el mismo viaje.
--
-- Lo que esta métrica NO dice: si la unidad se detuvo, si alguien subió, ni si
-- pasó a la hora prevista. Solo dice que estuvo dentro del radio de la geocerca
-- el tiempo suficiente para que el sistema lo registrara.
--
-- Consecuencia importante: la cobertura depende del radio de geocerca y de la
-- permanencia mínima. Un radio demasiado pequeño baja la cobertura sin que el
-- servicio haya empeorado. Al comparar períodos hay que verificar que los
-- parámetros no cambiaron entre uno y otro.
with planificadas as (
  select v.id as viaje_id, pr.parada_id
  from viajes v
  join paradas_por_ruta pr on pr.ruta_id = v.ruta_id
  where v.iniciado_at >= now() - interval '7 days'
),
visitadas as (
  select e.viaje_id, e.parada_id
  from eventos_geocerca e
  join planificadas pl
    on pl.viaje_id = e.viaje_id and pl.parada_id = e.parada_id
)
select
  (select count(*) from planificadas) as planificadas,
  (select count(*) from visitadas)    as visitadas,
  round(
    100.0 * (select count(*) from visitadas)
          / nullif((select count(*) from planificadas), 0)
  , 1) as cobertura_pct;


-- ── VIAJES COMPLETADOS Y DURACIÓN PROMEDIO ──
--
-- Solo cuentan los viajes cerrados: uno abierto no tiene duración todavía.
select
  count(*) as viajes_completados,
  round(avg(extract(epoch from (finalizado_at - iniciado_at)) / 60)::numeric, 1) as duracion_promedio_min
from viajes
where finalizado_at is not null
  and iniciado_at >= now() - interval '7 days';


-- ── VIAJES POR DÍA Y POR RUTA ──
select
  date_trunc('day', v.iniciado_at)::date as dia,
  r.nombre as ruta,
  r.color  as color,
  count(*) as viajes
from viajes v
join rutas r on r.id = v.ruta_id
where v.iniciado_at >= now() - interval '7 days'
group by 1, 2, 3
order by 1, 2;


-- ── ZONAS PROBLEMÁTICAS ──
--
-- Tramos entre paradas consecutivas donde el recorrido tarda más que su propia
-- mediana histórica. Describe lo que ya pasó; no predice el tráfico de mañana.
with pasos as (
  select
    e.viaje_id,
    p.nombre as parada,
    e.entro_at,
    lag(e.entro_at) over (partition by e.viaje_id order by pr.avance) as entro_anterior,
    lag(p.nombre)   over (partition by e.viaje_id order by pr.avance) as parada_anterior
  from eventos_geocerca e
  join viajes v on v.id = e.viaje_id
  join paradas_por_ruta pr on pr.ruta_id = v.ruta_id and pr.parada_id = e.parada_id
  join paradas p on p.id = e.parada_id
),
tramos as (
  select
    parada_anterior || ' → ' || parada as tramo,
    extract(epoch from (entro_at - entro_anterior)) / 60 as minutos
  from pasos
  where entro_anterior is not null
)
select
  tramo,
  count(*) as viajes,
  round(avg(minutos)::numeric, 1)                                   as promedio_min,
  round((avg(minutos) - percentile_cont(0.5) within group (order by minutos))::numeric, 1) as sobre_mediana_min
from tramos
group by tramo
having count(*) >= 3
order by sobre_mediana_min desc nulls last;
