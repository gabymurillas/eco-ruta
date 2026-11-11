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

- `app_metadata` de administradores, operadores y dispositivos lleva `organizacion_id`, escrito solo
  desde el servidor, igual que hoy `rol` y `unidad_id`.
- Función nueva `organizacion_actual()`, que lee el claim, junto a `es_admin()`,
  `es_operador()` (ADR-0015) y `unidad_del_dispositivo()`.
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

## Guía de migración

Paso a paso para pasar de un solo cliente a la opción B **sin cortar el servicio**. Nada de
esto está implementado: es el plan para cuando se decida. Los números de migración (`sql/2x`)
son orientativos; se usan los siguientes que estén libres.

La idea que ordena todo: **primero se agrega y se rellena, después se exige, y recién al final
se cambian las políticas.** Cada paso deja el sistema funcionando igual que antes, y hasta el
paso 6 se puede volver atrás sin perder nada.

### 0. Antes de empezar

1. Respaldo completo de la base (`pg_dump`) y de las cuentas de Auth.
2. Todo el plan se ensaya primero en el clúster desechable de Postgres 17 + PostGIS, con una
   copia de los datos reales.
3. Las pruebas de fuga del paso 9 se escriben **antes** que las políticas nuevas: primero
   fallan, después pasan.
4. Ventana de mantenimiento solo para el paso 6 (unos minutos). El resto se hace en caliente.

### 1. Tabla `organizaciones` y la organización de la alcaldía (`sql/2a`)

```sql
create table organizaciones (
  id              uuid primary key default gen_random_uuid(),
  nombre          text not null,
  plan            text not null default 'piloto',
  limite_unidades int,
  web_publica     boolean not null default false,
  subdominio      text unique,
  creada_at       timestamptz not null default now()
);
alter table organizaciones enable row level security;

-- Id fijo y conocido: lo usan el backfill, los claims y las pruebas.
insert into organizaciones (id, nombre, web_publica, subdominio)
values ('00000000-0000-0000-0000-000000000001', 'Alcaldía de San Juan de los Morros', true, 'sanjuan');
```

### 2. Columna `organizacion_id`, nullable y con valor por defecto (`sql/2b`)

En `rutas`, `paradas`, `unidades`, `dispositivos`, `viajes`, `posiciones`, `eventos_geocerca`,
`avisos_parada`, `incidencias` y `parametros`:

```sql
alter table rutas add column organizacion_id uuid
  references organizaciones(id)
  default '00000000-0000-0000-0000-000000000001';
```

- Nullable por ahora: agregar la columna no reescribe la tabla ni bloquea escrituras.
- **El valor por defecto es temporal y es lo que permite migrar en caliente:** la web, la app
  Android y `registrar-posicion` viejas siguen insertando sin conocer la columna, y sus filas
  caen en la alcaldía.

### 3. Backfill a la organización Alcaldía (`sql/2c`)

```sql
update rutas set organizacion_id = '00000000-0000-0000-0000-000000000001' where organizacion_id is null;
-- igual en las demás tablas
```

`posiciones` es la tabla grande: se rellena por lotes (por rango de `id`, de a 50.000 filas)
para no sostener un bloqueo largo. Verificación: `select count(*) … where organizacion_id is
null` devuelve 0 en las diez tablas.

`parametros`: además del relleno, la llave primaria pasa de `(clave)` a
`(organizacion_id, clave)`.

### 4. Claims `organizacion_id` en `app_metadata` (antes de tocar RLS)

Las políticas nuevas leerán el claim. Si se activan antes de que todos los tokens lo traigan,
nadie ve nada. Orden:

1. **Admins y operadores existentes.** Un script de una sola vez con `service_role` (o desde el
   SQL Editor) fusiona el claim, sin tocar `rol`:

   ```sql
   update auth.users
      set raw_app_meta_data = raw_app_meta_data
          || '{"organizacion_id":"00000000-0000-0000-0000-000000000001"}'
    where raw_app_meta_data ->> 'rol' in ('admin', 'operador', 'dispositivo');
   ```

   El mismo `update` cubre a los **dispositivos** ya vinculados: no hay que revincular ningún
   teléfono.
2. **Edge Function `vincular-dispositivo`.** El canje (`canjear_codigo_de_vinculacion`) devuelve
   también `organizacion_id` de la unidad, y la función lo escribe junto a `rol` y `unidad_id`:
   `app_metadata: { rol: "dispositivo", unidad_id, organizacion_id }`. Así toda vinculación
   nueva nace con el claim.
3. **Edge Function `gestionar-equipo` (ADR-0015).** Al invitar escribe
   `app_metadata: { rol, organizacion_id }` con la organización **de quien invita** (leída de
   su cuenta en Auth, nunca del cuerpo de la petición). Al listar, cambiar el rol o quitar el
   acceso, filtra por la misma organización: un admin de A no ve ni toca cuentas de B.
4. **Esperar a que los tokens se renueven.** Un token de acceso dura una hora; el claim nuevo
   aparece en la siguiente renovación. Se espera al menos ese tiempo (o un día, para cubrir
   teléfonos apagados) antes del paso 6. Comprobación: ninguna cuenta con rol queda sin
   `organizacion_id` en `auth.users`.

### 5. Funciones de identidad (`sql/2d`)

```sql
create or replace function organizacion_actual() returns uuid
language sql stable security invoker set search_path = public as $$
  select nullif(auth.jwt() -> 'app_metadata' ->> 'organizacion_id', '')::uuid;
$$;

create or replace function es_superadmin() returns boolean
language sql stable security invoker set search_path = public as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'rol', '') = 'superadmin';
$$;
```

`es_admin()`, `es_operador()` y `unidad_del_dispositivo()` no cambian.

### 6. Exigir la columna y cambiar las políticas (`sql/2e`, en ventana de mantenimiento)

En una sola transacción:

1. `alter table … alter column organizacion_id set not null` en las diez tablas, e índice por
   `organizacion_id` (en `posiciones`, compuesto: `(organizacion_id, unidad_id, capturado_at desc)`).
2. Restricciones únicas de negocio con `organizacion_id` (nombre de ruta por organización;
   `dispositivos_codigo_idx` sigue siendo global: el código identifica por sí solo).
3. **Políticas de RLS**, tabla por tabla:

   | Política | Antes | Después |
   |---|---|---|
   | `admin_total_*` | `es_admin()` | `es_admin() and organizacion_id = organizacion_actual()` (en `using` y `with check`) |
   | `operador_lee_*`, `operador_atiende_incidencias` | `es_operador()` | `es_operador() and organizacion_id = organizacion_actual()` |
   | `dispositivo_*` | `unidad_id = unidad_del_dispositivo()` | Igual, más `organizacion_id = organizacion_actual()` |
   | `publico_lee_*` | Filtros de ADR-0012 | Igual, más `organizacion_id in (select id from organizaciones where web_publica)` |
   | `organizaciones` | — | Lectura de la propia (`id = organizacion_actual()`); escritura solo `es_superadmin()` |
   | `superadmin_*` (nuevas) | — | Lectura de todo con `es_superadmin()`, registrada (paso 8) |

4. **Disparador que fija la organización al insertar**, en las tablas hijas: copia
   `organizacion_id` del padre (`viajes` de su unidad; `posiciones`, `eventos_geocerca`,
   `avisos_parada` e `incidencias` de su viaje o unidad) y rechaza un valor distinto. Con eso
   **se quita el valor por defecto del paso 2** sin que la app Android ni `registrar-posicion`
   tengan que enviar la columna, y un cliente no puede escribir en la organización de otro
   aunque lo intente.

### 7. Funciones RPC, vistas y Edge Functions (`sql/2f`)

Se revisan **una por una**; la lista completa sale de
`select oid::regprocedure, prosecdef from pg_proc where pronamespace = 'public'::regnamespace`.

| Objeto | Cambio |
|---|---|
| Lectura *invoker* (`estado_flota`, `rutas_para_mapa`, `paradas_de_ruta`, `paradas_de_la_ciudad`, `resumen_historicos`, `viajes_por_dia`, `resumen_por_ruta`, `viajes_grabados`, `recorrido_de_viaje`) | RLS ya las filtra. Se verifica cada una con la prueba de fuga; no se confía |
| Vista `paradas_por_ruta` | El cruce parada–trazado exige `p.organizacion_id = r.organizacion_id`: sin eso, la parada de un cliente «pertenece» a la ruta de otro que pase cerca |
| Públicas (`paradas_cercanas`, `llegadas_a_parada`) | Reciben la organización (resuelta por subdominio) y filtran por ella |
| Escritura *invoker* (`guardar_trazado_de_ruta`, `crear_parada`, `mover_parada`) | `crear_parada` inserta con `organizacion_actual()`; las otras quedan cubiertas por RLS |
| ***Definer*** (`eliminar_unidad`, `canjear_codigo_de_vinculacion`, `registrar_auth_de_dispositivo`, `registrar_salud_del_dispositivo`, `posiciones_para_suavizar`, `estado_de_geocercas`) | **Saltan RLS: cada una filtra a mano.** `eliminar_unidad` exige que la unidad sea de `organizacion_actual()`; las de geocercas reciben la organización del viaje y cruzan solo paradas y rutas de esa organización |
| `parametros` | Toda lectura pasa a `where organizacion_id = …`. `registrar-posicion` lee los umbrales de la organización de la unidad |
| Límite del plan | Disparador en `unidades`: rechaza la unidad número `limite_unidades + 1` |
| Realtime | Respeta RLS; se verifica que un canal de A no reciba cambios de B |

### 8. Equipo y superadmin

- **Equipo (ADR-0015) no cambia de forma:** sigue siendo `gestionar-equipo`, ahora acotada a la
  organización de quien llama (paso 4.3). Admin y operador conservan su significado, dentro
  de su organización.
- **`superadmin`** es un tercer valor de `app_metadata.rol`, sin `organizacion_id`. Solo se
  asigna a mano (SQL Editor): `gestionar-equipo` nunca lo concede ni lo lista, y
  `leerRolDelPanel` lo sigue rechazando en el panel de los clientes.
- Acciones nuevas en `gestionar-equipo` (o una función aparte), solo para superadmin: crear una
  organización, sembrar sus parámetros por defecto e invitar a su primer admin.
- Tabla `accesos_de_soporte` (quién, a qué organización, cuándo, motivo): toda lectura de un
  superadmin sobre datos de un cliente deja fila.
- La regla «siempre queda un admin» pasa a ser **por organización**.

### 9. Pruebas automáticas de fuga entre organizaciones

Guion SQL que corre en el clúster desechable en cada migración y en CI; un solo fallo bloquea
el despliegue.

1. Sembrar dos organizaciones, A y B, con rutas, paradas, unidades, viajes, posiciones,
   incidencias y parámetros propios.
2. Para cada actor de A (admin, operador, dispositivo) y para `anon` del subdominio de A:
   - `select` en **cada tabla** con RLS: cero filas de B;
   - `insert`, `update` y `delete` sobre filas de B: cero filas afectadas o error;
   - `insert` propio con `organizacion_id` de B: rechazado;
   - **cada RPC** con identificadores de B (ruta, viaje, parada, unidad): vacío o error.
3. Un claim manipulado no sirve: un token con `organizacion_id` en `user_metadata` no ve nada.
4. **La prueba se descubre sola:** recorre `pg_tables` y `pg_proc`. Una tabla con RLS sin
   columna `organizacion_id`, o una función *definer* sin caso de prueba, hace fallar el guion.
   Así una tabla nueva no puede nacer sin su política.
5. En `gestionar-equipo`: un admin de A no lista, no cambia y no borra cuentas de B (prueba de
   `_dominio/equipo.ts` con Node).

Es la misma técnica de la matriz por rol con que se probó `sql/17`, con una dimensión más.

### 10. Web y app Android

**Web**

- Web pública: el proxy resuelve la organización por subdominio y la pasa a las RPC públicas.
- Panel: no necesita selector; la organización sale del token. Solo cambian los servicios que
  llaman RPC con parámetros nuevos, y los tipos regenerados (`npm run types:db`).
- Panel de superadmin: sección aparte, fuera del alcance de esta guía.

**App Android** (otro repositorio; se anuncia por `docs/contrato-vinculacion.md`)

- **No envía `organizacion_id` en ningún cuerpo:** viaja en el token y la base lo fija sola
  (paso 6.4). La app instalada sigue funcionando sin actualizarse.
- La respuesta de `vincular-dispositivo` agrega `organizacion: { id, nombre }` para mostrarla
  en la pantalla de vinculación. Es un campo nuevo y opcional: no rompe versiones viejas.
- Los parámetros que la app lee pasan a ser los de su organización; RLS filtra, y la consulta
  no cambia.
- Recomendado, no obligatorio: envío por lotes (ver «Volumen y costos»).

### 11. Orden de despliegue

| # | Qué | Reversible |
|---|---|---|
| 1 | `sql/2a`–`2c`: tabla, columna nullable con valor por defecto, backfill | Sí: `drop column` |
| 2 | Claims en Auth; `vincular-dispositivo` y `gestionar-equipo` nuevas | Sí: el claim de más no molesta |
| 3 | Esperar la renovación de tokens (≥ 1 h; ideal 24 h) | — |
| 4 | `sql/2d`: funciones de identidad | Sí |
| 5 | Pruebas de fuga en verde en el clúster desechable con copia de producción | — |
| 6 | **Ventana:** `sql/2e` (not null, políticas, disparadores) y `sql/2f` (funciones) | Con el plan de reversa |
| 7 | Web nueva (subdominios) | Sí: volver al despliegue anterior en Vercel |
| 8 | Segunda organización de prueba; repetir las pruebas de fuga contra producción con cuentas de prueba | — |
| 9 | Quitar el valor por defecto temporal de `organizacion_id` | Sí |

### 12. Plan de reversa

- **Hasta el paso 5 no hay nada que revertir:** las columnas y los claims nuevos no cambian el
  comportamiento.
- **El paso 6 lleva su migración inversa escrita y ensayada de antemano** (`sql/2e_reversa`):
  restaura las políticas de `sql/03`, `sql/13` y `sql/17` tal como están hoy, quita los
  disparadores y los `not null`. **No borra `organizacion_id`:** los datos quedan intactos y
  se puede reintentar.
- La reversa solo es segura **mientras exista una sola organización con datos**. Con dos
  clientes reales, volver a «el admin ve todo» sería justamente la fuga que se quiere evitar:
  desde ese momento se corrige hacia adelante, nunca hacia atrás.
- Criterio para revertir: cualquier fallo de las pruebas de fuga en producción, o un actor
  legítimo (admin, operador, dispositivo, público) que deja de ver sus datos y no se corrige
  en la ventana.
- El respaldo del paso 0 es el último recurso; restaurarlo pierde la telemetría recibida
  desde entonces (los teléfonos reenvían lo que tengan en su buffer de 2 horas).

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
