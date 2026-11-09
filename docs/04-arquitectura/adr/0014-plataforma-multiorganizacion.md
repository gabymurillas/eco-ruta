# ADR-0014 — Una sola plataforma para varias organizaciones (multiorganización)

| Campo | Valor |
|---|---|
| Estado | Propuesto — **no se implementa antes de la defensa de la tesis** |
| Registrado | 2026-11-09 |
| Responsable | Gabrieli Murillas Ramírez |

## Contexto

EcoRuta nació para un solo cliente: la Alcaldía de San Juan de los Morros. El modelo de datos
lo refleja: no hay dueño de los datos, `es_admin()` deja ver **todo** a cualquier cuenta con
`rol = admin` y los parámetros son globales.

El sistema sirve, casi sin cambios, a otros clientes con vehículos en recorrido:
cooperativas de transporte, transporte escolar y de personal, universidades, camiones
cisterna y distribuidoras. `rutas.tipo` ya es texto libre y `rutas.icono` ya cubre bus,
camión, cisterna y van. Lo que impide atender a un segundo cliente es el aislamiento de
los datos, no la funcionalidad.

Hay dos formas de atender a varios clientes:

- **A. Una instalación por cliente:** un proyecto de Supabase y un despliegue web propios.
- **B. Una sola plataforma:** una instalación compartida, donde cada fila sabe de qué
  organización es.

## Decisión propuesta

1. **Mientras dure la tesis, nada cambia.** El sistema se defiende con un solo cliente,
   que es más simple de explicar.
2. **Los primeros clientes externos usan la opción A**, que no exige reprogramar nada.
3. **Se migra a la opción B al llegar a unos 4 o 5 clientes**, o antes si mantener varias
   copias al día empieza a costar más que la migración.

### Cómo sería la opción B

**Modelo**

- Tabla nueva `organizaciones` (`id`, `nombre`, `plan`, `limite_unidades`, `web_publica`,
  `subdominio`).
- Columna `organizacion_id uuid not null references organizaciones(id)` con índice en
  `rutas`, `paradas`, `unidades`, `dispositivos`, `viajes`, `posiciones`,
  `eventos_geocerca`, `avisos_parada` e `incidencias`. En las tablas hijas se duplica a
  propósito: RLS no tiene que hacer joins para decidir, y `posiciones`, la tabla más
  escrita, se filtra por una columna indexada.
- `parametros` pasa a ser por organización: llave `(organizacion_id, clave)`. Cada cliente
  calibra sus propios valores (ADR-0008 sigue vigente dentro de cada organización).
- Las paradas siguen siendo «de la ciudad» (ADR-0007), pero de la ciudad **de cada
  organización**: dos clientes en la misma ciudad no comparten paradas.
- Las restricciones únicas de negocio incluyen `organizacion_id` cuando corresponde (por
  ejemplo, el nombre de una ruta es único dentro de su organización, no en todo el sistema).
- Los datos actuales pasan a la organización «Alcaldía de San Juan de los Morros».

**Identidad (extiende ADR-0009)**

- `app_metadata` de administradores y dispositivos lleva `organizacion_id`, escrito solo
  desde el servidor, igual que hoy `rol` y `unidad_id`.
- Función nueva `organizacion_actual()`, que lee el claim, junto a `es_admin()` y
  `unidad_actual()`.
- Rol nuevo `superadmin` (el equipo de EcoRuta): crea organizaciones, invita a su primer
  administrador y da soporte. Su acceso a los datos de un cliente queda registrado.

**Seguridad (RLS)**

- Las políticas pasan de «si eres admin, todo» a «si eres admin, **lo de tu organización**»:
  `using (es_admin() and organizacion_id = organizacion_actual())`, también en `with check`.
- El dispositivo sigue escribiendo solo datos de su unidad. Además, la organización de la
  fila debe ser la suya.
- **Pruebas automáticas de fuga entre organizaciones**, obligatorias antes de cada
  migración: con la sesión de un admin de A, toda lectura y escritura sobre datos de B
  devuelve cero filas o falla. Una fuga entre clientes es el peor error posible de esta
  plataforma.
- Regla nueva para el repositorio: **toda tabla nueva nace con `organizacion_id` y su
  política**.

**Web pública (extiende ADR-0010 y ADR-0012)**

- Cada organización con `web_publica = true` se sirve en su subdominio
  (`<subdominio>.ecoruta.app`, nombre de dominio por definir) y solo muestra sus rutas.
- Las flotas privadas no tienen web pública: su seguimiento queda solo en el panel.
- La política de exposición (`docs/05-trust-safety/`) se revisa para el caso multicliente.

**Operación**

- El límite del plan lo hace cumplir la base: no se puede registrar la unidad número
  `limite_unidades + 1`.
- La facturación cuenta las unidades activas de cada organización al cierre del mes.

### Volumen y costos esperados

Con `emision_movimiento_s` = 5 y unas 10 h de servicio al día, cada vehículo genera unas
7.200 posiciones diarias. Son estimaciones, a unos 200 bytes por fila con su índice:

| Vehículos | Posiciones al mes | Espacio al mes |
|---|---|---|
| 20 | ~4 millones | ~1 GB |
| 100 | ~21 millones | ~4 GB |
| 1.000 | ~216 millones | ~40 GB |

- **Almacenamiento:** queda acotado por la retención de 90 días (ADR-0013). Pasados unos
  cientos de vehículos, conviene particionar `posiciones` por mes: borrar un mes vencido
  se vuelve instantáneo.
- **Llamadas a `registrar-posicion`:** hoy el teléfono envía cada lectura en cuanto la
  tiene, y cada envío es una ejecución que se cobra. La función **ya acepta un arreglo**
  de posiciones (lo usa el buffer sin conexión, ADR-0004), así que agrupar el envío normal
  (por ejemplo, 6 lecturas cada 30 s) solo cambia la app. El costo de agruparlas: como la
  geocerca se evalúa contra la lectura más reciente del lote, un aviso de llegada puede
  salir hasta un intervalo de lote más tarde. El intervalo de lote tiene que ser un
  parámetro calibrable y no superar `permanencia_minima_s`.
- **Realtime:** cada cambio se reenvía a cada suscriptor. En la web pública, el volumen
  crece con la gente que mira el mapa, no con la flota. Hay que limitar la frecuencia de
  actualización del público (15 a 30 s alcanzan para un tiempo estimado).
- **Plan de Supabase:** para clientes que pagan, el plan gratuito no sirve (poco
  espacio y pausa por inactividad). Se usa el plan Pro y se sube la capacidad de cómputo
  según la carga. Los precios y cuotas vigentes se verifican en la página de Supabase antes
  de fijar el precio a los clientes.

## Consecuencias

- Una sola instalación que actualizar, respaldar y vigilar, en vez de una por cliente.
- La seguridad pasa a depender de que **todas** las políticas filtren por organización.
  Una política olvidada expone datos de un cliente a otro. Por eso las pruebas de fuga son
  parte de la decisión, no un extra.
- Las consultas de PostGIS y las vistas (`paradas_por_ruta`, `rutas_para_mapa`,
  `llegadas_a_parada`) tienen que filtrar por organización. Hay que revisarlas una por una.
- Migración estimada: 1 a 2 semanas más pruebas, porque son pocas tablas. El costo crece con
  cada tabla y política que se agregue antes de hacerla.
- No hay dependencia sin salida: Supabase es de código abierto y por debajo es PostgreSQL con
  PostGIS. Si la escala o el costo lo exigen, se puede alojar en servidor propio o llevar
  la base a otro proveedor de PostgreSQL, reemplazando solo Auth, Realtime y las Edge
  Functions.

## Alternativas consideradas

- **Solo la opción A, para siempre:** simple y con aislamiento total, pero cada corrección
  y migración se repite en cada cliente. No escala más allá de unos pocos.
- **Un esquema de PostgreSQL por cliente dentro de la misma base:** aísla bien, pero Supabase
  expone un esquema fijo por la API, y las migraciones se multiplican por cada esquema.
- **Hacer la opción B ya, antes de la tesis:** agrega complejidad que el jurado no necesita
  evaluar y que ningún cliente pide todavía.
- **Cambiar de base de datos por una «más grande»:** innecesario. El límite real son el
  diseño (retención, particiones, envío por lotes) y el costo por uso, no PostgreSQL.

## Pendiente fuera de lo técnico

Antes de ofrecer el sistema a terceros: confirmar con el reglamento de la UNERG la propiedad
del trabajo de grado, firmar con la alcaldía una **licencia de uso** (no una cesión) y
definir un nombre comercial que no sea el de la alcaldía.
