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
  recta.
- La velocidad es el promedio de las últimas 5 posiciones usables, con un piso mínimo.
- Con una incidencia activa se aplica una penalización y la interfaz lo indica.
- En la interfaz y en la documentación: «tiempo estimado» o «ETA estimado». **Nunca
  «predictivo».**

## 4. Tiempo estimado con historial — versión mínima *(Propuesto, CIU-09)*

Decisión de producto del 2026-11-04: entra al alcance de la tesis en su versión mínima. El
diseño está en [ADR-0011](adr/0011-eta-estimado-con-historial.md). En resumen:

1. **Agregado.** Por cada viaje finalizado, la velocidad efectiva por tramo se resume en
   `velocidades_por_franja (ruta_id, tipo_dia, franja, mediana_kmh, viajes)`, con `tipo_dia` ∈
   {laborable, fin de semana} y una franja de `eta_historico_franja_min` (60 por defecto).
2. **Uso.** Si la franja actual de la ruta tiene al menos `eta_historico_min_viajes` viajes, la
   velocidad de referencia es la mediana histórica, ajustada por la velocidad en vivo cuando la
   unidad se está moviendo. Si no, se usa el cálculo actual (§3).
3. **Comunicación.** Sigue siendo «tiempo estimado». No cambia el texto de la interfaz.
4. **Evaluación.** Métrica M2 del PRD: no debe ser peor que el cálculo simple sobre los mismos
   viajes.
5. **Datos.** El agregado sobrevive a la retención de 90 días de las posiciones crudas; por eso
   el agregado corre **antes** del borrado.

Riesgo declarado: al 2026-11-04 no hay viajes reales. Si la prueba de campo no produce
suficientes viajes por franja, el sistema cae al cálculo simple y la tesis presenta el mecanismo
con datos simulados, rotulados como tales.
