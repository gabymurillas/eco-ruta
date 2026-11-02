-- ============================================================
-- Parámetros calibrables del sistema
-- Se ajustan tras la prueba de campo de precisión GPS.
-- Nunca hardcodear estos valores en el código.
-- ============================================================

create table parametros (
  clave       text primary key,
  valor       numeric not null,
  descripcion text
);

insert into parametros (clave, valor, descripcion) values
  ('permanencia_minima_s', 45,  'Segundos dentro de la geocerca antes de notificar'),
  ('histeresis_salida_s',  30,  'Segundos fuera antes de dar por terminada la estadia'),
  ('exactitud_maxima_m',   50,  'Lecturas con exactitud peor a esto no evaluan geocercas'),
  ('sin_senal_umbral_s',   300, 'Segundos sin senal antes de marcar la unidad como perdida'),
  ('bateria_alerta_pct',   15,  'Porcentaje de bateria que dispara alerta en el admin'),
  ('emision_movimiento_s', 5,   'Intervalo de emision con vehiculo en movimiento'),
  ('emision_detenido_s',   30,  'Intervalo de emision con vehiculo detenido'),
  ('radio_aproximacion_m', 500, 'Distancia a la parada a la que se avisa que la unidad se acerca');
