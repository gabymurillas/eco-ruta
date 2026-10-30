-- ============================================================
-- Incidencia de tipo 'otro': una observación libre desde el dispositivo
-- Corre después de 01_schema.sql. Es idempotente: se puede volver a correr.
--
-- El conductor puede reportar algo que no es ninguno de los cuatro tipos del
-- PDF (un bache, un semáforo dañado) escribiendo solo la observación. Llega con
-- tipo 'otro', y en ese caso la descripción es obligatoria: un 'otro' sin texto
-- no le dice nada al administrador.
-- ============================================================

alter table incidencias drop constraint if exists incidencias_tipo_check;
alter table incidencias add constraint incidencias_tipo_check
  check (tipo in ('calle_cerrada','falla_mecanica','desvio','congestion','otro'));

alter table incidencias drop constraint if exists incidencias_otro_con_descripcion;
alter table incidencias add constraint incidencias_otro_con_descripcion
  check (tipo <> 'otro' or nullif(btrim(descripcion), '') is not null);
