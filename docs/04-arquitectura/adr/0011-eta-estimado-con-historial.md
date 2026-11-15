# ADR-0011 — Tiempo estimado con historial por franja horaria (versión mínima)

| Campo | Valor |
|---|---|
| Estado | Aceptado (implementado en `sql/19`; falta evaluarlo con viajes reales, M2) |
| Registrado | 2026-11-04 |
| Aceptado | 2026-11-15 |
| Responsable | Gabrieli Murillas Ramírez |

## Contexto

Hoy el tiempo estimado es la distancia sobre el trazado ÷ la velocidad reciente. CLAUDE.md declaraba el modelo con historial como trabajo futuro, y el análisis de factibilidad advirtió que sin datos históricos no hay predicción. El 2026-11-04 la autora decidió incluir una versión mínima en la tesis. Al día de hoy no hay viajes reales grabados.

## Decisión

1. Un proceso nocturno guarda, por viaje finalizado, su velocidad efectiva en `velocidades_de_viaje` (una fila por viaje: ruta, `tipo_dia`, `hora`, `velocidad_kmh`). La mediana por franja se calcula al vuelo (`velocidad_historica_kmh`). Esto reemplaza la tabla `velocidades_por_franja` con la mediana guardada que proponía la primera versión de este ADR: una mediana no se puede actualizar de forma incremental y la retención (ADR-0013) borraría los viajes viejos.
2. La franja es la hora de inicio del viaje (hora de Caracas) más el tipo de día (hábil o fin de semana). Un viaje que no sirve de muestra (menos de 10 lecturas, menos de 300 s, menos de 500 m o más de 90 km/h) se guarda con velocidad nula y no cuenta.
3. Si la franja tiene al menos `eta_historico_min_viajes` viajes (5 por defecto), la velocidad de referencia es: con la unidad andando (más de 8 km/h), 50 % mediana histórica y 50 % velocidad en vivo; detenida, solo la mediana. Sin historial suficiente se usa el cálculo simple.
4. El parámetro va en `parametros` (ADR-0008) y se edita en `/admin/parametros`.
5. El texto de la interfaz no cambia: «tiempo estimado», nunca «predictivo».
6. Se evalúa contra el cálculo simple (métrica M2).

## Consecuencias

- Responde a «a las 7 a. m. la ruta va más lenta» sin aprendizaje automático.
- Los viajes agregados sobreviven a la retención de 90 días (ADR-0013): la retención solo borra posiciones de viajes que ya tienen su fila en `velocidades_de_viaje`.
- Riesgo: sin datos suficientes, el sistema cae siempre al cálculo simple. Se acepta y se declara.

## Alternativas descartadas

- **Modelo de aprendizaje automático:** sin datos y sin plazo para validarlo.
- **Dejarlo como trabajo futuro:** era la decisión anterior; la autora la cambió.
