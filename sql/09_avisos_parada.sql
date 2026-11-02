-- ============================================================
-- Avisos al ciudadano: «se acerca a tu parada» y «ya pasó por tu parada»
-- Para una base que ya tiene 01 a 08 aplicados. Es idempotente: se puede volver
-- a correr. En una instalación nueva no hace falta: 01, 02 y 03 ya lo incluyen.
--
-- DESPUÉS de este archivo hay que volver a correr 07_geocercas.sql, que cambia
-- `estado_de_geocercas`, y desplegar `registrar-posicion`. Entre una cosa y la
-- otra la función desplegada llama a la versión vieja, que ya no existe, y la
-- evaluación falla: conviene hacerlo seguido.
--
-- Por qué una tabla aparte y no columnas en `eventos_geocerca`: el aviso de
-- aproximación ocurre antes de que la unidad entre a la parada, cuando todavía
-- no hay evento (su `entro_at` es obligatorio). Y separar el estado interno del
-- algoritmo de lo que se publica deja que el ciudadano lea solo esto.
-- ============================================================


create table if not exists avisos_parada (
  id        uuid primary key default gen_random_uuid(),
  viaje_id  uuid not null references viajes(id) on delete cascade,
  unidad_id uuid not null references unidades(id) on delete cascade,
  parada_id uuid not null references paradas(id) on delete cascade,
  tipo      text not null check (tipo in ('acercandose','paso')),
  creado_at timestamptz not null default now(),
  unique (viaje_id, parada_id, tipo)
);

create index if not exists avisos_parada_parada_idx
  on avisos_parada (parada_id, creado_at desc);


-- ── RLS ──
alter table avisos_parada enable row level security;

drop policy if exists publico_lee_avisos on avisos_parada;
create policy publico_lee_avisos on avisos_parada
  for select using (true);

drop policy if exists admin_total_avisos on avisos_parada;
create policy admin_total_avisos on avisos_parada
  for all using (es_admin()) with check (es_admin());


-- ── PARÁMETRO CALIBRABLE ──
-- `do nothing`: si ya se calibró, volver a correr el archivo no lo pisa.
insert into parametros (clave, valor, descripcion) values
  ('radio_aproximacion_m', 500, 'Distancia a la parada a la que se avisa que la unidad se acerca')
on conflict (clave) do nothing;


-- ── PUBLICACIÓN DE REALTIME ──
--
-- Supabase solo emite cambios de las tablas que están en `supabase_realtime`.
-- `alter publication ... add table` falla si la tabla ya está, de ahí la
-- comprobación.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'avisos_parada'
  ) then
    alter publication supabase_realtime add table avisos_parada;
  end if;
end
$$;
