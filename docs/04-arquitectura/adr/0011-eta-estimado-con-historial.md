# ADR-0011 — Tiempo estimado con historial por franja horaria (versión mínima)

| Campo | Valor |
|---|---|
| Estado | Propuesto |
| Registrado | 2026-11-04 |
| Responsable | Gabrieli Murillas Ramírez |

## Contexto

Hoy el tiempo estimado es la distancia sobre el trazado ÷ la velocidad reciente. CLAUDE.md declaraba el modelo con historial como trabajo futuro, y el análisis de factibilidad advirtió que sin datos históricos no hay predicción. El 2026-11-04 la autora decidió incluir una versión mínima en la tesis. Al día de hoy no hay viajes reales grabados.

## Decisión

1. Un proceso agrega, por viaje finalizado, la velocidad efectiva en `velocidades_por_franja (ruta_id, tipo_dia, franja, mediana_kmh, viajes)`.
2. Si la franja actual tiene al menos `eta_historico_min_viajes` viajes, la velocidad de referencia es la mediana histórica, ajustada por la velocidad en vivo si la unidad se mueve; si no, se usa el cálculo simple.
3. Los parámetros nuevos van en `parametros` (ADR-0008).
4. El texto de la interfaz no cambia: «tiempo estimado», nunca «predictivo».
5. Se evalúa contra el cálculo simple (métrica M2).

## Consecuencias

- Responde a «a las 7 a. m. la ruta va más lenta» sin aprendizaje automático.
- El agregado sobrevive a la retención de 90 días (ADR-0013).
- Riesgo: sin datos suficientes, el sistema cae siempre al cálculo simple. Se acepta y se declara.

## Alternativas descartadas

- **Modelo de aprendizaje automático:** sin datos y sin plazo para validarlo.
- **Dejarlo como trabajo futuro:** era la decisión anterior; la autora la cambió.
