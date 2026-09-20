# Contrato de vinculación del dispositivo

Frontera entre `ecoruta-web` (admin) y `ecoruta-ruta` (app del vehículo). La app **solo
consume** este contrato; el backend lo implementa y lo mantiene la sesión que trabaja
la web.

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

1. **Guarda `refresh_token`** en almacenamiento seguro (`expo-secure-store`, no
   AsyncStorage: AsyncStorage es texto plano legible en un dispositivo rooteado).
2. Entrega la sesión a supabase-js con `setSession({ access_token, refresh_token })`.
   A partir de ahí la librería renueva sola; el `access_token` dura una hora.
3. **Guarda `unidad.id` y `unidad.nombre`** para mostrarlos y para armar los `insert`.
4. La vinculación es **única y permanente** salvo que el admin genere un código nuevo.
   No hay pantalla de «cerrar sesión»: el teléfono pertenece a la unidad, no a una persona.

El código **se consume al canjearse**. Reintentar con el mismo código devuelve 401.

---

## Qué puede hacer la app una vez vinculada

Con el token de dispositivo, RLS le permite exactamente esto:

| Operación | Tabla | Condición que impone RLS |
|---|---|---|
| Insertar posiciones | `posiciones` | `unidad_id` = el suyo |
| Abrir y cerrar viajes | `viajes` | `unidad_id` = el suyo |
| Reportar incidencias | `incidencias` | `unidad_id` = el suyo |
| Leer rutas, paradas, parámetros | varias | lectura pública |

Cualquier intento de escribir con otro `unidad_id` lo rechaza Postgres, no el cliente.

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

- **Evaluación de geocercas.** Al insertar una posición no se dispara nada aún. La Edge
  Function de geocercas es trabajo del backend (ver `.claude/skills/edge-geocerca/`).
- **Realtime.** El admin refresca por consulta, no por suscripción.

Si la app necesita algo del backend que no está aquí, **pídelo en vez de resolverlo
subiendo privilegios en el cliente**.
