# Contrato de vinculación del dispositivo

Frontera entre este repositorio (web + backend) y la app del vehículo, que es un
proyecto Android aparte. La app **solo consume** este contrato; el backend lo
implementa y lo mantiene la sesión que trabaja la web.

---

## La regla que no se negocia

**La clave `service_role` nunca entra en el APK.** Esa clave salta RLS por completo y se
extrae de un APK en minutos: quien la tenga puede leer y borrar toda la base.

Si algo no se puede hacer con la clave anónima, la respuesta no es subir de privilegio en
el cliente, es pedir una Edge Function. La app usa **solo** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
(la clave publicable) y el token de sesión que recibe al vincularse.

---

## Por qué existe una Edge Function y no se resuelve en la app

RLS decide si una unidad puede escribir sus posiciones leyendo un claim del token:

```sql
-- sql/03_rls.sql
create policy dispositivo_escribe_posicion on posiciones
  for insert with check (unidad_id = unidad_del_dispositivo());

-- lee auth.jwt() -> 'app_metadata' ->> 'unidad_id'
```

`app_metadata` **solo se escribe desde el servidor**. Si usáramos `user_metadata`, el
propio teléfono podría reasignarse a otra unidad y enviar telemetría falsa en nombre
ajeno. Por eso el canje del código ocurre en el servidor.

---

## El endpoint

```
POST https://yumfwnqvmcitjnskazgx.supabase.co/functions/v1/vincular-dispositivo
Content-Type: application/json
apikey: <clave publicable>
```

No lleva `Authorization`: el teléfono aún no tiene sesión. Lo que autoriza es **conocer
un código válido**, de un solo uso y vigente por 10 minutos.

### Petición

```json
{ "codigo": "4T9K2" }
```

El código lo genera el admin desde `/admin/unidades` → «Vincular». Son 5 caracteres de un
alfabeto que excluye los que se confunden al leer (`0/O`, `1/I/L`, `5/S`), porque alguien
lo teclea dentro de un vehículo y a contraluz.

### Respuesta correcta — 200

```json
{
  "unidad": {
    "id": "d97c008a-9dc7-4251-947b-feb3196a5bc7",
    "nombre": "Unidad 12",
    "ruta_id": "2393d27b-cbc6-4b6e-81f3-04d5bd85e5eb",
    "ruta": "Ruta de prueba · Sector oeste"
  },
  "sesion": {
    "access_token": "eyJ…",
    "refresh_token": "…",
    "expires_at": 1758067200
  }
}
```

### Errores

| Código | Cuerpo | Qué mostrar |
|---|---|---|
| 400 | `{ "error": "Escribe el código de vinculación." }` | El campo llegó vacío |
| 401 | `{ "error": "El código no es válido o ya venció." }` | Tal cual, sin más detalle |
| 500 | `{ "error": "…" }` | Mensaje genérico y opción de reintentar |

El 401 no distingue «no existe» de «venció» a propósito: decirlo ayudaría a quien prueba
códigos por fuerza bruta.

---

## Qué hace la app con la respuesta

1. **Guarda `refresh_token`** cifrado con Android Keystore. Guardarlo en
   SharedPreferences a secas lo deja en texto plano, legible en un equipo rooteado —
   y con ese token cualquiera escribe telemetría en nombre de la unidad.
2. Entrega la sesión a supabase-js con `setSession({ access_token, refresh_token })`.
   A partir de ahí la librería renueva sola; el `access_token` dura una hora.
3. **Guarda `unidad.id` y `unidad.nombre`** para mostrarlos y para armar los `insert`.
   `unidad.ruta_id` sirve para abrir un viaje sin una consulta extra, pero es la
   ruta **al momento de vincular**: si el admin reasigna la unidad a otra ruta, el
   valor guardado queda viejo y los viajes se abrirían contra la ruta equivocada.
   Si eso puede pasar en el despliegue real, léelo en vivo al iniciar recorrido
   (`GET unidades?id=eq.<id>&select=ruta_id`, lectura pública) y usa el del canje
   solo como respaldo sin red.
4. La vinculación es **única y permanente** salvo que el admin genere un código nuevo.
   No hay pantalla de «cerrar sesión»: el teléfono pertenece a la unidad, no a una persona.

El código **se consume al canjearse**. Reintentar con el mismo código devuelve 401.

---

## Qué puede hacer la app una vez vinculada

Con el token de dispositivo, RLS le permite exactamente esto:

| Operación | Tabla | Condición que impone RLS |
|---|---|---|
| Insertar posiciones | `posiciones` | `unidad_id` = el suyo — **pero no las insertes directo, ver abajo** |
| Reportar batería y señal | `dispositivos` | vía RPC, ver abajo |
| Abrir y cerrar viajes | `viajes` | `unidad_id` = el suyo |
| Reportar incidencias | `incidencias` | `unidad_id` = el suyo |
| Leer rutas, paradas, parámetros | varias | lectura pública |

Cualquier intento de escribir con otro `unidad_id` lo rechaza Postgres, no el cliente.

### La telemetría va por Edge Function, no por insert directo

```
POST /functions/v1/registrar-posicion
Cabeceras: apikey + Authorization: Bearer <access_token>

{
  "viaje_id": "fb3e56a3-…",          // null o ausente si no hay recorrido abierto
  "posiciones": [
    { "lat": 9.9165, "lng": -67.379,
      "exactitud_m": 12, "velocidad_kmh": 38,
      "capturado_at": "2026-09-21T01:55:00Z" }
  ]
}

→ 200 { "guardadas": 1, "evaluada": true, "notificadas": ["Parada 1"],
        "avisos": [{ "tipo": "acercandose", "parada": "Parada 2" }] }
```

`avisos` es lo que se publicó al ciudadano en esta llamada (`acercandose` o `paso`). Es
informativo, como `notificadas`: la app no tiene que hacer nada con él. Se agregó sin
cambiar los demás campos, así que un cliente que no lo lee sigue funcionando.

RLS te deja insertar en `posiciones` y seguirá dejándote, pero **por esa vía no se
evalúa ninguna geocerca**: la posición se guarda y no pasa nada más. Este endpoint
guarda y evalúa en la misma llamada.

El insert lo hace la función **con tu propio token**, no con `service_role`, así que
RLS sigue siendo quien garantiza que solo escribas tu unidad. Un `unidad_id` ajeno
devuelve 403.

Detalles que afectan tu implementación:

- **`posiciones` es un arreglo**: manda el buffer offline completo en una llamada en
  vez de una petición por lectura. Pueden venir desordenadas; la función las ordena.
- **Las geocercas se evalúan solo contra la lectura más reciente del lote.** Cuando el
  teléfono recupera señal y descarga veinte minutos de cola, notificar por una parada
  que la unidad ya dejó atrás sería peor que no notificar: el ciudadano saldría a
  esperar un vehículo que ya pasó.
- **`exactitud_m` importa de verdad.** Si supera `exactitud_maxima_m`, la lectura se
  guarda marcada `usable = false` y no evalúa geocercas: la respuesta trae
  `"evaluada": false`. Mándalo siempre que el GPS lo dé.
- **`capturado_at` es del teléfono**, y solo se usa para ordenar y para el histórico.
  La permanencia en la parada se mide con el reloj del servidor.
- Un 5xx significa que no se guardó: **no borres esas lecturas del buffer**, reintenta.
- **Un viaje ya cerrado se puede subir con su `viaje_id`, y conviene hacerlo**: las
  lecturas quedan atribuidas al recorrido, que es lo que necesitan el histórico y la
  cobertura de paradas. No hay riesgo de notificación tardía — la evaluación solo mira
  viajes abiertos, así que un respaldo así responde `"evaluada": false`.
- `"evaluada": false` en un 200 significa: se guardó, no se evaluó. Pasa si el viaje está
  cerrado, si no mandaste `viaje_id`, si la última lectura del lote no era usable o si la
  ruta no tiene paradas cargadas. No es un error.

### El latido va por RPC, no por PATCH

```
POST /rest/v1/rpc/registrar_salud_del_dispositivo
{ "bateria": 83 }        → 204. `bateria` es opcional.
```

**Un PATCH directo a `dispositivos` no funciona y no da error**: RLS reserva esa
tabla al administrador, así que la petición afecta 0 filas y responde 200 con
`[]`. Si viste eso, no era un bug tuyo.

Por qué una función y no una política de RLS: RLS filtra filas, no columnas. Una
política que dejara al dispositivo escribir su propia fila le dejaría escribir
*toda* la fila, incluidos `codigo_vinculacion` y `codigo_expira_at` — un equipo
comprometido podría emitirse una vinculación nueva. La función fija en su cuerpo
las dos únicas columnas que toca.

Dos consecuencias para la app:

- **`ultima_senal_at` lo pone el servidor con `now()`**, no se manda. Un teléfono
  que estuvo desenchufado suele arrancar con la hora corrida, y esa marca es la
  que decide si el admin da la unidad por caída.
- **La unidad sale del JWT**, no de un parámetro. No hay forma de escribir el
  latido de otra unidad, ni de equivocarse de `unidad_id`.

**Manda el primer latido apenas termine la vinculación.** El panel trata a un
equipo vinculado que nunca reportó como caído, que es justo lo que se quiere ver
cuando la vinculación se completó pero el teléfono no llegó a levantar.

Cadencia sugerida: la misma de `emision_detenido_s`. El umbral con el que el
panel da por caído un equipo es `sin_senal_umbral_s`.

### Las incidencias van por insert directo

```
POST /rest/v1/incidencias
{ "ruta_id": "…", "unidad_id": "<el suyo>", "tipo": "otro",
  "descripcion": "Semáforo dañado en la Av. Bolívar" }
```

`tipo` es uno de `calle_cerrada`, `falla_mecanica`, `desvio`, `congestion` u `otro`.

**`otro` exige `descripcion`.** Es la observación libre del conductor, para lo que no
encaja en los cuatro tipos (un bache, un semáforo dañado): sin texto no le dice nada
al administrador. Un `otro` con la descripción vacía o solo con espacios lo rechaza
Postgres con un 400 (`23514`, `incidencias_otro_con_descripcion`). En los otros
cuatro tipos la descripción es opcional.

Valídalo también en la pantalla, para que el botón no se active sin texto: el 400 está
para que un cliente con un error no pueda colar el registro, no para avisarle al
conductor.

### Los parámetros de emisión salen de la base, no del código

```ts
// mal: se desincroniza del servidor que evalúa las geocercas
const INTERVALO = 5000;

// bien
const { data } = await supabase.from("parametros").select("clave, valor");
```

Claves relevantes para la app: `emision_movimiento_s`, `emision_detenido_s`,
`exactitud_maxima_m`, `sin_senal_umbral_s`.

---

## Estado: verificado

El endpoint está desplegado con `verify_jwt = false` y probado de punta a punta
el 20/09/2026. Lo comprobado, no lo supuesto:

| Caso | Resultado |
|---|---|
| Código válido (incluso en minúsculas) | 200 con unidad y sesión |
| El mismo código por segunda vez | 401 |
| Petición sin código | 400 |
| El token escribe una posición de **su** unidad | 201 |
| El token escribe una posición de **otra** unidad | 403, `42501` desde Postgres |
| El token lee la tabla `dispositivos` | `[]` — RLS la reserva al admin |
| El token llama a `registrar_salud_del_dispositivo` | 204, y el panel ve la batería |
| El token hace PATCH a `dispositivos` con `codigo_vinculacion` | no escribe nada |
| `anon` llama a `registrar_salud_del_dispositivo` | 401, permiso denegado |

El token emitido trae `app_metadata: { rol: "dispositivo", unidad_id: … }`.

---

## Prueba de humo

```bash
# 1. Genera un código en /admin/unidades → «Vincular»
# 2. Cánjealo:
curl -X POST \
  "https://yumfwnqvmcitjnskazgx.supabase.co/functions/v1/vincular-dispositivo" \
  -H "apikey: <clave publicable>" \
  -H "Content-Type: application/json" \
  -d '{"codigo":"4T9K2"}'

# 3. Repite la misma llamada: debe dar 401. El código es de un solo uso.
```

---

## Lo que todavía no existe

- **Entrega de la notificación al ciudadano.** La evaluación ya corre y marca
  `eventos_geocerca.notificado_at`, pero nada empuja ese aviso a la pantalla del
  ciudadano todavía: falta Realtime. La lógica está completa; el último tramo no.
- **Realtime.** El admin refresca por consulta, no por suscripción.

Si la app necesita algo del backend que no está aquí, **pídelo en vez de resolverlo
subiendo privilegios en el cliente**.
