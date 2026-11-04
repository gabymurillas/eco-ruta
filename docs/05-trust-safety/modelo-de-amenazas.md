# Modelo de amenazas

| Campo | Valor |
|---|---|
| Método | STRIDE por activo, con controles existentes y brechas |
| Última revisión | 2026-11-04 |
| Próxima revisión | Antes de la defensa y antes de cualquier piloto |

## 1. Activos

| Activo | Sensibilidad | Dónde |
|---|---|---|
| Posición en vivo de las unidades | Alta (seguridad de choferes) | `posiciones`, Realtime |
| Historial de recorridos | Alta (revela patrones) | `posiciones`, `viajes` |
| Ubicación del ciudadano | Alta (personal) | Navegador; parámetro de la RPC `paradas_cercanas` |
| Credenciales del admin | Crítica | Supabase Auth |
| Sesión del dispositivo | Alta | Android Keystore; Supabase Auth |
| Clave `service_role` | Crítica | Solo en las Edge Functions y la sesión local del CLI |
| Configuración (rutas, paradas, parámetros) | Media (integridad) | Tablas del admin |
| Texto libre de incidencias | Media (puede contener datos personales) | `incidencias.descripcion` |

## 2. Actores de amenaza

| Actor | Motivación | Capacidad |
|---|---|---|
| Delincuente local | Robo o extorsión a unidades y choferes | Lee la web y la API pública |
| Bromista o vándalo | Avisos falsos, desorden | Intenta escribir sin autorización |
| Quien roba un teléfono de unidad | Revenderlo o usar su sesión | Acceso físico al dispositivo |
| Atacante oportunista | Tomar el admin o extraer datos | Credenciales filtradas, ingeniería inversa del APK |
| Abuso involuntario | Agotar las cuotas gratuitas | Raspado de datos o tráfico alto |

## 3. Amenazas y controles

| ID | STRIDE | Amenaza | Control existente | Brecha |
|---|---|---|---|---|
| A1 | Information disclosure | Seguir unidades y reconstruir patrones de recorrido | Política de exposición (ADR-0012) | **TS-01**: la RLS pública no filtra por viaje activo |
| A2 | Spoofing | Enviar telemetría falsa en nombre de una unidad | RLS por `app_metadata.unidad_id`; canje en el servidor; `service_role` fuera del APK | — |
| A3 | Spoofing | Adivinar un código de vinculación | 5 caracteres, 10 minutos, un solo uso | Considerar un límite de intentos en `vincular-dispositivo` (TS-10) |
| A4 | Elevation of privilege | Autonombrarse admin | El rol vive en `app_metadata` (solo servidor) | — |
| A5 | Spoofing | Robo de la cuenta del admin | Contraseña de Supabase Auth | **TS-05**: sin MFA |
| A6 | Tampering | Teléfono robado sigue transmitiendo | `eliminar_unidad` revoca la cuenta | **TS-04**: no hay «desvincular» sin borrar la unidad |
| A7 | Information disclosure | La ubicación del ciudadano queda en registros | No se guarda en tablas | **TS-09**: viaja exacta al servidor; puede quedar en los registros del proveedor |
| A8 | Information disclosure | Texto libre de incidencias con datos personales u ofensas | Solo el chofer puede escribir | **TS-03**: legible por la API pública |
| A9 | Repudiation | Avisos o tiempos erróneos sin trazabilidad | `eventos_geocerca` y `avisos_parada` con marcas de tiempo | — |
| A10 | Denial of service | Agotar las cuotas del plan gratuito | Límites propios de Supabase y Vercel | **TS-10**: sin límites propios |
| A11 | Denial of service | Bloqueo por uso de OSM, OSRM o Photon | Volumen bajo; URLs configurables | TS-06 (vigilar) |
| A12 | Tampering | Desinformación por un tiempo estimado engañoso | Rotulado «estimado»; estado «sin señal»; penalización por incidencia | — |
| A13 | Information disclosure | Filtración de `service_role` | Solo en el servidor; nunca en el repositorio | Rotación documentada en [respuesta a incidentes](respuesta-a-incidentes.md) |

## 4. Riesgos aceptados

- **Avisos solo con la página abierta.** Se acepta y se explica al ciudadano.
- **Posición en vivo pública durante el viaje.** Es la función del producto. Se mitiga acotándola
  al viaje activo y sin datos del chofer.
- **Dependencia de servicios públicos gratuitos.** Aceptable para el volumen de la tesis.
