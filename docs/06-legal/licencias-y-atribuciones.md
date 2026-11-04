# Licencias y atribuciones

| Campo | Valor |
|---|---|
| Última revisión | 2026-11-04 |
| Fuente | `package.json` de cada dependencia (web) y `gradle/libs.versions.toml` (app) |

## 1. Licencia del proyecto

**Todos los derechos reservados.** © 2026 Gabrieli Murillas Ramírez.

El código de este repositorio y de la app del dispositivo no se distribuye bajo una licencia
abierta. Su uso, copia o modificación requieren autorización escrita de la autora, salvo la
evaluación académica del jurado de la UNERG. Ver [propiedad-intelectual.md](propiedad-intelectual.md).

**Pendiente:** agregar un archivo `LICENSE` en la raíz de ambos repositorios con este aviso.

## 2. Dependencias de terceros — web

| Componente | Licencia | Obligación |
|---|---|---|
| Next.js | MIT | Conservar el aviso de copyright |
| React, React DOM | MIT | Ídem |
| Tailwind CSS | MIT | Ídem |
| @supabase/supabase-js, @supabase/ssr | MIT | Ídem |
| Leaflet | BSD-2-Clause | Conservar el aviso; mantener la atribución en el mapa |
| **react-leaflet** | **Hippocratic License 2.1** | Licencia **ética**, no aprobada por la OSI: prohíbe usos que violen los derechos humanos según estándares internacionales. Es compatible con este proyecto, pero hay que conocerla. Si un piloto exigiera software libre (Ley de Infogobierno), habría que revisarla o sustituirla |
| TypeScript, ESLint | Apache-2.0 / MIT | Herramientas de desarrollo; no se distribuyen |

## 3. Dependencias de terceros — app Android

| Componente | Licencia |
|---|---|
| AndroidX (Core, Lifecycle, Activity, Navigation, Compose, Material 3, Room, DataStore, WorkManager) | Apache-2.0 |
| Kotlin, kotlinx.coroutines, kotlinx.serialization | Apache-2.0 |
| Retrofit, OkHttp | Apache-2.0 |
| Google Play Services Location | Propietaria (términos del SDK de Android / Google APIs) |

## 4. Tipografías

| Fuente | Licencia | Uso |
|---|---|---|
| Merriweather | SIL Open Font License 1.1 | Web (Google Fonts vía `next/font`) y app (incluida en el APK, con su licencia en `assets/licenses/`) |
| Source Sans 3 | SIL Open Font License 1.1 | Ídem |

## 5. Datos y servicios

| Servicio | Licencia o política | Atribución obligatoria |
|---|---|---|
| **Datos de OpenStreetMap** | ODbL 1.0 | «© colaboradores de OpenStreetMap», enlazado a `openstreetmap.org/copyright`. ✅ Implementado en `components/mapa/Mapa.tsx` |
| Teselas `tile.openstreetmap.org` | Política de uso de teselas de la OSMF | Volumen bajo, agente de usuario válido, sin descarga masiva. Para un piloto hay que pasar a un proveedor propio o comercial |
| Photon (Komoot) | Servicio público de uso razonable; datos de OSM (ODbL) | Atribución a OSM. Solo en el admin, con espera entre pulsaciones |
| OSRM (`router.project-osrm.org`) | Servidor de demostración; uso no intensivo | Atribución a OSM. Solo en el admin |

## 6. Fotografía y herramientas

| Activo | Titular | Nota |
|---|---|---|
| Atardecer sobre los Morros de San Juan | Gabrieli Murillas Ramírez (foto propia) | Ampliada ×4 con Real-ESRGAN (BSD-3-Clause); la herramienta no adquiere derechos sobre el resultado |

## 7. Pantalla de créditos

**Pendiente (P2):** una página o sección «Acerca de» en la web con las atribuciones de OSM,
Leaflet y las fuentes, y el aviso de copyright.
