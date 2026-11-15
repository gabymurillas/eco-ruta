# Geocercas, avisos y tiempo estimado

| Campo | Valor |
|---|---|
| Estado | Aprobado (§1–§3) · Propuesto (§4) |
| Implementación | `supabase/functions/registrar-posicion/` y `supabase/functions/_dominio/` |
| Última revisión | 2026-11-04 |

Esta es la lógica crítica del sistema. **No se simplifica**: cada paso responde a un problema
real detectado en la revisión técnica (julio de 2026, punto 4).

## 1. Evaluación de geocercas (5 pasos)

Corre de forma síncrona en `registrar-posicion`, sobre la lectura más reciente de cada lote.

```
1. FILTRO DE CALIDAD
   si exactitud_m > exactitud_maxima_m → guardar con usable=false y TERMINAR

2. SUAVIZADO
   media ponderada de las últimas 3 posiciones usables

3. DETECTAR PARADAS CERCANAS
   ST_DWithin(posicion_suavizada, parada.ubicacion, parada.radio_geocerca_m)

4. POR CADA PARADA DENTRO
   sin evento previo     → crear evento, no notificar (empieza a contar la permanencia)
   evento sin notificar  → si permanencia ≥ permanencia_minima_s → marcar notificado_at
   evento ya notificado  → nada; nunca se repite en el mismo viaje

5. DETECTAR SALIDAS (histéresis)
   salida solo tras histeresis_salida_s continuos fuera; si reentra antes, nunca salió
```

**Por qué:** sin permanencia ni histéresis, la deriva del GPS hace que una unidad «entre y
salga» varias veces por minuto y el ciudadano reciba avisos repetidos.

Reglas puras: `_dominio/telemetria.ts` (filtro y suavizado) y `_dominio/geocerca.ts`
(permanencia e histéresis), sin dependencias, para poder leerlas y defenderlas por separado.

## 2. Avisos al ciudadano

Salen del mismo estado que calculan los 5 pasos (`_dominio/avisos.ts`):

| Aviso | Condición |
|---|---|
| **Se acerca** (`acercandose`) | Dentro de `radio_aproximacion_m` (500 m), fuera del radio de la parada y todavía sin evento en este viaje |
| **Ya pasó** (`paso`) | Salida confirmada por la histéresis del paso 5 |

No existe el aviso «está en tu parada»: en San Juan de los Morros los buses no esperan, y la
permanencia que exige `notificado_at` llegaría tarde o nunca.

**Limitación conocida:** el anillo de 500 m mide en línea recta. Una ruta que da la vuelta y pasa
cerca de una parada que le toca mucho después avisaría antes de tiempo. Se corrige midiendo
sobre el trazado, con la misma base que el tiempo estimado.

## 3. Tiempo estimado (actual)

```
tiempo_estimado = distancia_restante_sobre_el_trazado / velocidad_referencia
```

- La distancia sigue el trazado real (`ST_LineLocatePoint` + `ST_LineSubstring`), no la línea
  recta. La calcula `llegadas_a_parada` (`sql/14_tiempo_estimado.sql`); la cuenta en minutos la
  hace el dominio de la web (`domain/eta.ts`, `estimarLlegada` en `domain/llegadas.ts`).
- Si la unidad está más adelante que la parada sobre el trazado: en una ruta circular (inicio
  y fin a menos de `distancia_parada_trazado_m`) se da la vuelta; en una abierta la fila dice
  «Ya pasó por aquí». Una diferencia menor a esa misma tolerancia es deriva del GPS con la
  unidad encima de la parada y se muestra «Llegando».
- La velocidad es el promedio de las últimas 5 posiciones usables del viaje (las lecturas sin
  velocidad se descartan), con un piso de 8 km/h.
- Con una incidencia activa en la ruta se suma `penalizacion_incidencia_pct` (25 %) y la fila
  lo dice.
- Solo hay cifra con la ruta trazada y la señal fresca. Sin trazado: «En camino»; con la señal
  perdida: «Sin confirmar».
- En la interfaz y en la documentación: «tiempo estimado» o «ETA estimado». **Nunca
  «predictivo».**

## 4. Tiempo estimado con historial — versión mínima *(CIU-09)*

Decisión de producto del 2026-11-04, implementada el 2026-11-15 (`sql/19`). El diseño está en
[ADR-0011](adr/0011-eta-estimado-con-historial.md). En resumen:

1. **Agregado.** Cada noche, el job `ecoruta-mantenimiento-nocturno` guarda la velocidad efectiva
   de cada viaje finalizado en `velocidades_de_viaje`: la suma de los tramos entre posiciones
   usables consecutivas dividida entre la duración (las paradas cuentan). No sirve de muestra
   (velocidad nula) un viaje con menos de 10 lecturas, menos de 300 s, menos de 500 m o más de
   90 km/h. La franja es la hora de inicio del viaje (Caracas) y el tipo de día (hábil o fin de
   semana).
2. **Mediana al vuelo.** `velocidad_historica_kmh(ruta, momento)` calcula la mediana de la franja
   y la devuelve solo si hay al menos `eta_historico_min_viajes` viajes (5); si no, nula.
   `llegadas_a_parada` la entrega en la columna `velocidad_historica_kmh`.
3. **Velocidad de referencia.** Sin historial: la velocidad en vivo de §3. Con historial y la
   unidad andando (más de 8 km/h): 50 % mediana y 50 % velocidad en vivo. Con historial y la
   unidad detenida: solo la mediana.
4. **Comunicación.** Sigue siendo «tiempo estimado». No cambia el texto de la interfaz.
5. **Evaluación.** Métrica M2 del PRD: no debe ser peor que el cálculo simple sobre los mismos
   viajes. Falta contrastarlo con viajes reales.
6. **Datos.** Los viajes agregados sobreviven a la retención de 90 días de las posiciones crudas
   (ADR-0013); por eso el agregado corre **antes** del borrado, en el mismo job.

Riesgo declarado: al 2026-11-04 no hay viajes reales. Si la prueba de campo no produce
suficientes viajes por franja, el sistema cae al cálculo simple y la tesis presenta el mecanismo
con datos simulados, rotulados como tales.
