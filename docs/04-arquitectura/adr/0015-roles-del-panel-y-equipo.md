# ADR-0015 — Dos roles en el panel (admin y operador) y gestión del equipo por Edge Function

| Campo | Valor |
|---|---|
| Estado | Aceptado. Implementado en el código (`sql/17_roles_del_panel.sql`, `supabase/functions/gestionar-equipo/`, `/admin/equipo`); pendiente de aplicar en Supabase |
| Registrado | 2026-11-10 |
| Responsable | Gabrieli Murillas Ramírez |
| Extiende | [ADR-0009](0009-vinculacion-por-codigo.md) (claims en `app_metadata`) |

## Contexto

El panel tenía un solo rol, `admin`, con acceso completo, y las cuentas se creaban a mano en
el panel de Supabase. En la alcaldía eso no alcanza: quien vigila la flota en la sala de
monitoreo no debería poder borrar una ruta ni vincular un teléfono, y agregar o sacar a una
persona no puede depender de que la autora entre a Supabase.

Tres restricciones del proyecto condicionan la solución:

- El rol vive en `app_metadata` del JWT, que solo se escribe desde el servidor (ADR-0009).
- **`service_role` no entra en la web ni en el APK.** Invitar, listar cuentas, cambiar
  `app_metadata` y borrar cuentas usan la API de administración de Auth, que exige esa clave.
- La autorización real es RLS; la interfaz solo acompaña.

## Decisión

### 1. Dos roles, en `app_metadata.rol`

| Rol | Puede |
|---|---|
| `admin` | Todo: configurar rutas, trazados, paradas, unidades y parámetros; vincular teléfonos; gestionar el equipo |
| `operador` | Monitoreo en vivo, históricos y lectura de rutas, paradas y unidades. **Atiende incidencias** (cambia su estado). Nada más |

`dispositivo` sigue siendo el rol de las cuentas de los teléfonos: no entra al panel ni
aparece en Equipo.

### 2. Lo impone la base (`sql/17`)

- `es_operador()` junto a `es_admin()`. Las políticas `admin_total_*` no cambian.
- Políticas `operador_lee_*` (solo `select`) en todas las tablas. Las funciones de lectura son
  *security invoker*, así que les alcanza con eso.
- Las funciones de escritura (`guardar_trazado_de_ruta`, `crear_parada`, `mover_parada`)
  también son *invoker*: al operador lo frena RLS sin tocarlas. `eliminar_unidad` (*definer*)
  ya exigía `es_admin()`.
- **Incidencias:** política `operador_atiende_incidencias` (update) más el disparador
  `incidencias_solo_estado_para_operador`, que solo le deja cambiar `activa` y `resuelta_at`.
  RLS filtra filas, no columnas; sin el disparador podría reescribir la descripción.
- **Código de vinculación:** el operador no ve las filas de `dispositivos` que tienen un
  código pendiente. Quien lee un código vigente puede atar un teléfono propio a la unidad.

### 3. El equipo se gestiona con una Edge Function: `gestionar-equipo`

Acciones: `listar`, `invitar`, `reenviar`, `cambiar_rol`, `quitar`. La web la llama desde
Server Actions con el token de la sesión. La función:

1. Consulta la cuenta de quien llama en Auth (`getUser`) y exige `rol = 'admin'`. Usa el rol
   **vigente**, no el del token: un admin degradado hace un minuto ya no pasa.
2. Recién entonces usa `service_role`, que Supabase le inyecta.
3. Aplica las reglas de `_dominio/equipo.ts` (puras, probadas con Node):
   - nadie cambia su propio rol ni se quita el acceso;
   - siempre queda al menos un admin que ya aceptó su invitación;
   - solo se listan y modifican cuentas con rol `admin` u `operador`;
   - solo se invita a correos sin cuenta: nunca se le da rol a una cuenta existente.

El rol se escribe en `app_metadata` con `updateUserById`, nunca con el `data` de la
invitación (eso escribe `user_metadata`, que la propia persona puede editar).

### 4. La invitación reutiliza el flujo de recuperación de contraseña

`inviteUserByEmail` → correo → `/admin/auth/confirmar?token_hash=…&type=invite` →
`verifyOtp({ type: 'invite' })` → sesión corta → `/admin/restablecer` → contraseña → panel.
Es la misma ruta, la misma marca de un solo uso y la misma pantalla que la recuperación.

Exige cambiar la plantilla «Invite user» de Supabase para que mande `token_hash`
([arquitectura § 7](../README.md#7-configurar-supabase-para-el-equipo-del-panel)). Un enlace
PKCE (`code`) solo sirve en el navegador que lo pidió, y una invitación la abre otra persona;
el enlace por defecto devuelve la sesión en el fragmento de la dirección, que no llega al
servidor.

### 5. Quitar el acceso **borra** la cuenta (no la suspende)

- Caen sus sesiones y sus tokens de renovación.
- El correo queda libre: si la persona vuelve, se la invita de nuevo, por el mismo camino.
- No se conserva ningún dato de quien ya no trabaja en el ente (minimización).
- No se pierde historial: ninguna tabla referencia a las cuentas del panel.
- Equipo no necesita un tercer estado («suspendido») ni una acción para reactivar.

### 6. En la web, tres barreras por acción

1. La interfaz no ofrece al operador lo que no puede usar (menú, botones, páginas de edición
   que lo devuelven a la lista).
2. Cada Server Action de escritura llama a `exigirAdministrador()`, que consulta el rol vigente.
3. RLS.

## Consecuencias

- Agregar una tabla o una función obliga a decidir qué puede el operador. Una tabla nueva sin
  política `operador_lee_*` le sale vacía; una función *definer* nueva debe verificar el rol.
- Hay una tercera Edge Function que desplegar y una plantilla de correo que configurar. Sin la
  plantilla, las invitaciones no se pueden aceptar.
- **Ventana del token (TS-11):** RLS lee el rol del JWT. Tras degradar o dar de baja a alguien,
  el token de acceso que ya tenía vale hasta que vence (una hora por defecto). La web y
  `gestionar-equipo` no tienen esa ventana porque consultan Auth. Se acepta para la tesis.
- Con un código de vinculación pendiente, el operador ve esa unidad como «sin vincular» y sin
  batería ni última señal, hasta que el teléfono lo canjee. Es correcto: al generar el código
  la unidad queda `vinculado = false`.
- La regla de «nunca cero admins» se evalúa en la función, no en la base: dos admins que se
  degradan mutuamente en el mismo instante podrían burlarla. Se recupera desde el SQL Editor.
- Para [ADR-0014](0014-plataforma-multiorganizacion.md): `gestionar-equipo` es el punto único
  donde se escribirá `organizacion_id` al invitar, y donde vivirá el rol `superadmin`.

## Alternativas descartadas

- **`service_role` en el servidor de Next.js (variable en Vercel, módulo `server-only`).** Es
  menos código y no requiere desplegar una función. Se descartó porque rompe una regla del
  proyecto que no admite excepciones («`service_role` jamás entra en la web»): la clave pasaría
  a vivir en Vercel, en los registros de compilación posibles y al alcance de cualquier error
  de importación que la arrastre al navegador. Con la Edge Function la clave nunca sale de
  Supabase.
- **Funciones SQL *security definer* sobre `auth.users`** (como `eliminar_unidad`) para cambiar
  el rol y quitar el acceso. Sirve para esas dos, pero la invitación por correo necesita la API
  de Auth de todas formas; repartir el equipo entre SQL y una función duplicaba las reglas.
- **Suspender (ban) en vez de borrar.** Conserva la cuenta, pero agrega un estado y una acción
  más, guarda datos de quien se fue y bloquea el correo. Sin historial que proteger no aporta.
- **Tabla `perfiles` con el rol.** Permitiría consultar el rol vigente desde RLS (sin la
  ventana del token), pero duplica la identidad que ya vive en Auth y cuesta una lectura por
  cada política. Es la salida si TS-11 dejara de ser aceptable.
- **Restringir columnas con `grant update (activa, resuelta_at)`.** No sirve: admin y operador
  comparten el rol `authenticated` de Postgres (mismo motivo que el latido en `sql/06`).
- **Una RPC `resolver_incidencia` en vez de política + disparador.** Equivalente en seguridad,
  pero obligaba a cambiar la web y a regenerar tipos, y dejaba el orden de despliegue (web
  antes o después de la migración) capaz de romper «marcar como resuelta» para el admin.
- **Permisos granulares por sección.** Dos roles cubren lo que la alcaldía describió; más
  granularidad es complejidad que nadie pidió.
