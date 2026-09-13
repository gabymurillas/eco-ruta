---
name: edge-geocerca
description: Implementar o revisar la Edge Function de evaluación de geocercas (Supabase, Deno/TypeScript), o cualquier trabajo sobre notificaciones por proximidad, permanencia, histéresis o suavizado de telemetría.
---

# Edge Function de geocercas

**No la simplifiques.** Cada paso responde a un problema real detectado en la revisión técnica
del proyecto. Antes de tocar: lee `sql/01_schema.sql` y `sql/02_parametros.sql`.

## Algoritmo (se dispara con cada posición nueva)

```
1. FILTRO DE CALIDAD
   si exactitud_m > parametros.exactitud_maxima_m
     → guardar posición con usable=false y TERMINAR (no se evalúan geocercas con lectura mala)

2. SUAVIZADO
   media ponderada de las últimas 3 posiciones usables

3. DETECTAR PARADAS CERCANAS
   ST_DWithin(posicion_suavizada, parada.ubicacion, parada.radio_geocerca_m)

4. POR CADA PARADA DENTRO:
   - sin evento previo     → crear evento, NO notificar (empieza a contar permanencia)
   - evento sin notificar  → si permanencia >= parametros.permanencia_minima_s → NOTIFICAR
   - evento ya notificado  → nada. Nunca se repite en el mismo viaje.

5. DETECTAR SALIDAS (histéresis)
   salida solo tras parametros.histeresis_salida_s continuos fuera.
   Si reentra antes → se considera que nunca salió (absorbe la deriva del GPS).
```

## Por qué importa

Sin permanencia mínima e histéresis, la deriva del GPS hace que la unidad "entre y salga" de
la geocerca varias veces por minuto y el usuario recibe notificaciones spam.

## Garantías que no se tocan

- La geocerca se evalúa contra la posición de la **unidad**, nunca la del ciudadano. El
  ciudadano no instala nada ni ejecuta procesos.
- `eventos_geocerca` tiene `unique (viaje_id, parada_id)`: aunque la lógica falle, la base
  rechaza el duplicado. No la quites como "redundante" — es la garantía final.
- Todo umbral de tiempo/distancia sale de `parametros`, nunca hardcodeado. Se calibran tras la
  prueba de campo de GPS (roadmap paso 1, va antes que esto).
- Canal de notificación: alerta en pantalla vía Realtime, no push.

## Lógica compartida

El filtro de exactitud y el suavizado son conceptualmente los mismos que en
`ecoruta-web/src/domain/telemetria.ts` y `ecoruta-ruta/src/domain/telemetria.ts` (cuando
existan). Una implementación por proyecto, no una por pantalla.

## Texto

"tiempo estimado" / "ETA estimado". Nunca "predictivo": el modelo con históricos es trabajo
futuro declarado, fuera de alcance.
