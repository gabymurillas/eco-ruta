# Política de privacidad — EcoRuta San Juan

| Campo | Valor |
|---|---|
| Estado | Borrador para revisión legal |
| Vigencia | Desde su publicación en la web (pendiente) |
| Responsable del tratamiento | Durante la tesis: Gabrieli Murillas Ramírez. En un piloto: el ente gestor (por definir) |
| Contacto | Por definir antes de publicar |
| Última revisión | 2026-11-04 |

> Este texto describe el comportamiento real del sistema al 2026-11-04. Las secciones marcadas
> con «(pendiente)» describen un compromiso aprobado que todavía no está implementado (ver el
> [registro de brechas](../05-trust-safety/registro-de-brechas.md)). No se debe publicar como
> vigente hasta que esté implementado o hasta ajustar el texto.

---

## Versión para el ciudadano (texto propuesto para la web)

**Tu privacidad en EcoRuta, en corto:**

- **No tienes cuenta.** No te pedimos nombre, correo ni teléfono.
- **Tu ubicación** se usa solo para encontrar las paradas cercanas a ti. La enviamos una vez a
  nuestro servidor para hacer esa búsqueda y **no la guardamos**.
- **Tu parada** se recuerda solo en este navegador. Si borras los datos del navegador, se olvida.
- **No usamos cookies de seguimiento ni publicidad.**
- El mapa lo dibujan servicios de **OpenStreetMap**, que reciben tu dirección IP y la zona del
  mapa que estás viendo, como cualquier sitio web que cargas.

---

## Versión completa

### 1. Qué datos tratamos

| Categoría | Datos | Origen | Base y finalidad | Conservación |
|---|---|---|---|---|
| Ubicación del ciudadano | Latitud y longitud aproximadas del navegador | Permiso explícito del navegador | Consentimiento; buscar paradas cercanas | **No se almacena** en la base. Puede figurar de forma transitoria en los registros técnicos del proveedor (Supabase). (Pendiente: se redondeará a unos 100 m antes de enviarse) |
| Preferencias | Parada elegida; si ya viste el aviso de limitaciones | El ciudadano | Funcionamiento | Solo en `localStorage` del navegador; nunca se envía |
| Datos técnicos | IP, agente de usuario | Conexión | Funcionamiento y seguridad de la plataforma | Según los proveedores (Vercel, Supabase, OSM) |
| Telemetría de unidades | Posición, velocidad, exactitud y hora de los vehículos | Teléfono de la unidad | Interés público del servicio; seguimiento y tiempo estimado | 90 días en crudo (pendiente: job de borrado); los agregados por ruta y franja se conservan indefinidamente |
| Salud del dispositivo | Batería y última señal | Teléfono de la unidad | Operación | Mientras exista la unidad |
| Incidencias | Tipo, ruta, ubicación y texto libre opcional | Chofer | Operación y aviso al público | Mientras exista la ruta |
| Cuenta del admin | Correo y credenciales | Ente gestor | Acceso al panel | Mientras tenga acceso |

**No tratamos:** nombres, documentos de identidad ni datos de contacto de choferes; cuentas de
ciudadanos; datos de pago.

### 2. Sobre la telemetría y los choferes

La posición publicada es la de un **vehículo de servicio público**, no la de una persona. El
sistema no registra quién conduce. Aun así, como la posición de un vehículo puede revelar la de
quien lo maneja:

- Solo se muestra al público **mientras la unidad está en un viaje activo** (pendiente: TS-01).
- Los recorridos pasados solo los ve el ente gestor.
- No se usa para evaluar ni sancionar a los choferes.

### 3. Con quién se comparten

| Encargado | Función | Ubicación |
|---|---|---|
| Supabase Inc. | Base de datos, autenticación y tiempo real | Fuera de Venezuela |
| Vercel Inc. | Hospedaje web | Fuera de Venezuela |
| OpenStreetMap Foundation (teselas) | Mapa base | Fuera de Venezuela |
| Komoot (Photon) y OSRM | Búsqueda de lugares y ruteo, **solo en el panel del admin** | Fuera de Venezuela |

No vendemos ni cedemos datos a terceros con fines comerciales.

### 4. Tus derechos

En virtud del art. 28 de la Constitución (habeas data) puedes solicitar acceso, rectificación o
supresión de los datos que te conciernan. Como el ciudadano no tiene cuenta, en la práctica
EcoRuta no guarda datos que lo identifiquen. Para borrar tu parada guardada, borra los datos del
sitio en tu navegador.

### 5. Seguridad

Seguridad a nivel de fila en todas las tablas; claves privilegiadas solo en el servidor; tokens
del dispositivo cifrados con Android Keystore. El detalle está en
[Trust & Safety](../05-trust-safety/README.md).

### 6. Menores

El servicio es de información pública y no recoge datos que identifiquen a nadie, incluidos los
menores.

### 7. Cambios

Cualquier cambio que amplíe los datos tratados se publicará en esta página antes de aplicarse.
