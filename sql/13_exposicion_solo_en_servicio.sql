-- ============================================================
-- Exposicion publica solo durante un viaje activo (ADR-0012, cierra TS-01)
--
-- Antes: el publico leia toda posicion usable y todo viaje, asi que se podia
-- reconstruir cualquier recorrido terminado (incluso con recorrido_de_viaje) y la
-- web del ciudadano dibujaba unidades fuera de servicio en su ultima posicion.
--
-- Ahora: solo posiciones de viajes abiertos y solo viajes abiertos. Admin y
-- dispositivo no cambian: tienen sus propias politicas.
--
-- Efectos verificados:
--   - registrar-posicion inserta sin RETURNING, asi que un lote atrasado que llega
--     despues de "finalizar" se sigue guardando aunque el dispositivo ya no lo lea.
--   - llegadas_a_parada (invoker) devuelve unidad_lat/lng nulos para las unidades
--     sin viaje abierto; la web ya las omite del mapa y las lista como sin recorrido.
--   - Realtime aplica RLS por suscriptor: el canal publico deja de emitir esas filas.
--
-- Base ya existente: correr este archivo. En una base nueva basta 03_rls.sql.
-- ============================================================

drop policy if exists publico_lee_posiciones on posiciones;
create policy publico_lee_posiciones on posiciones
  for select using (
    usable
    and exists (
      select 1 from viajes v
      where v.id = posiciones.viaje_id
        and v.finalizado_at is null
    )
  );

drop policy if exists publico_lee_viajes on viajes;
create policy publico_lee_viajes on viajes
  for select using (finalizado_at is null);
