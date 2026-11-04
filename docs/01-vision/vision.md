# Documento de visión — EcoRuta San Juan

| Campo | Valor |
|---|---|
| Estado | Aprobado |
| Versión | 1.0 |
| Responsable | Gabrieli Murillas Ramírez (autora) |
| Última revisión | 2026-11-04 |
| Documentos relacionados | [PRD](../02-producto/PRD.md) · [PRODUCT.md](../../PRODUCT.md) · [Arquitectura](../04-arquitectura/README.md) |

---

## 1. Declaración de visión

> **Que nadie en San Juan de los Morros tenga que esperar a ciegas un servicio público.**

EcoRuta San Juan hace visible, en vivo y desde cualquier teléfono, dónde está el bus o el camión
de aseo y cuánto falta para que llegue a tu parada. No hace falta crear una cuenta ni instalar
nada.

## 2. El problema

En San Juan de los Morros (municipio Juan Germán Roscio, estado Guárico) el ciudadano no tiene
ninguna información sobre los servicios públicos que se mueven por la ciudad:

- **Transporte público.** Se espera en la parada sin saber si la unidad ya pasó, si viene o si
  hoy no sale. Se pierde tiempo y, a ciertas horas, la espera es insegura.
- **Recolección de desechos.** El camión pasa sin aviso. Si la bolsa se saca antes, queda en la
  calle; si se saca tarde, se pierde el paso.

**Lo que existe hoy:** esperar y adivinar, o depender de grupos de WhatsApp donde vecinos o
choferes avisan de forma informal, incompleta y sin cobertura para quien no está en el grupo.
Las plataformas globales de movilidad no cubren las rutas locales.

**Lo que lo hace difícil:** conectividad intermitente, cortes eléctricos frecuentes, teléfonos de
gama baja, datos móviles caros, GPS de baja precisión y ningún presupuesto para hardware de
rastreo dedicado.

## 3. La propuesta

Un sistema con tres superficies y un backend:

| Superficie | Para quién | Qué hace |
|---|---|---|
| Web del ciudadano | Cualquier persona, sin cuenta | Mi parada, unidades en vivo, tiempo estimado, avisos «se acerca» y «ya pasó» |
| Web de administración | Ente gestor (alcaldía) | Rutas, paradas, unidades, vinculación de teléfonos, parámetros, monitoreo e históricos |
| App del dispositivo de ruta | Teléfono dedicado en el vehículo | Transmite la posición; el chofer inicia y finaliza el recorrido y reporta incidencias |
| Backend (Supabase) | — | Datos, seguridad, evaluación de geocercas, avisos en tiempo real |

## 4. Pilares

1. **Transparencia en vivo.** La posición real de la unidad, no un horario que no se cumple.
2. **Cero fricción ciudadana.** Abrir la web y ver tu parada. Sin registro y sin app.
3. **Infraestructura mínima.** Un teléfono barato por unidad reemplaza al GPS dedicado; servicios
   gestionados en lugar de servidores propios.
4. **Robustez ante la realidad local.** Buffer offline, filtros contra la deriva del GPS y
   mapas ligeros.
5. **Confianza por diseño.** Avisos sin spam, tiempos que se declaran estimados y ningún dato
   que exponga a los choferes.

## 5. Diferenciadores

- **El teléfono pertenece a la ruta, no al chofer.** Resuelve el problema de adopción que
  señaló el análisis de factibilidad: no depende de que cada chofer instale y mantenga una app
  en su teléfono personal.
- **Geocercas en el servidor contra la unidad.** El ciudadano no ejecuta nada en segundo plano y
  no hay límite de geocercas por cliente.
- **Multi-servicio sin tocar el esquema.** El tipo de servicio es texto libre: transporte, aseo,
  agua o gas.

## 6. Principios de producto

1. La verdad antes que la apariencia: se dice «estimado» y se muestra «sin señal».
2. Cero fricción para el ciudadano.
3. Diseñado para la conectividad que existe.
4. Proteger a quien opera.
5. Cada decisión tiene que poder explicarse ante un jurado.

## 7. Alcance y horizonte

| Horizonte | Contenido | Estado |
|---|---|---|
| **H1 — Tesis** (defensa antes del 31-12-2026) | Sistema completo en San Juan de los Morros con transporte como servicio prioritario, aseo como segundo servicio, prueba de campo de GPS y tiempo estimado con historial (versión mínima) | En curso |
| **H2 — Piloto** | Operación real con la alcaldía, calibración con datos reales y sostenibilidad de costos | **Sin decidir**: depende de la defensa y del interés institucional |
| **H3 — Replicable** | Otros municipios | Fuera del horizonte actual |

**Fuera de alcance:** notificaciones push, cuentas de ciudadano, iOS, pagos y boletería.

## 8. Medida de éxito

| Dimensión | Pregunta |
|---|---|
| Precisión | ¿El tiempo estimado se acerca a la llegada real? |
| Corrección de avisos | ¿«Se acerca» y «ya pasó» llegan una sola vez y a tiempo? |
| Adopción | ¿El ciudadano vuelve? |

Las metas numéricas están en el [PRD §8](../02-producto/PRD.md#8-métricas-de-éxito).

## 9. Supuestos y riesgos principales

| Supuesto | Si falla… | Mitigación |
|---|---|---|
| El GPS de un teléfono barato basta para geocercas de unos 150 m | Avisos tardíos o falsos | Filtro de exactitud, suavizado, permanencia e histéresis; prueba de campo y parámetros calibrables |
| La alcaldía adoptará el sistema | No hay operación real después de la tesis | Demostración funcional y documentación orientada al ente gestor |
| Los planes gratuitos alcanzan | Pausa del proyecto en Supabase y límites | Supervisión de uso; alternativa de autoalojamiento documentada |
| Los choferes inician y finalizan el viaje | Sin viajes no hay datos | Interfaz de dos botones, kiosco y latido para detectar equipos caídos |
