# ADR-0005 — Leaflet + OpenStreetMap en lugar de Mapbox

| Campo | Valor |
|---|---|
| Estado | Aceptado |
| Registrado | 2026-11-04 |
| Responsable | Gabrieli Murillas Ramírez |

## Contexto

El ciudadano usa teléfonos de gama baja con datos móviles caros. Las geocercas necesitan círculos con radio en metros.

## Decisión

Se usa react-leaflet sobre Leaflet (unos 42 KB) con teselas de OpenStreetMap, sin clave.

## Consecuencias

- Carga ligera y sin cuenta de proveedor.
- El servidor público de teselas de OSM es para volumen bajo; si el sistema crece, se cambia la URL a un proveedor con atribución.
- react-leaflet usa la licencia Hippocratic 2.1 (ver [licencias](../../06-legal/licencias-y-atribuciones.md)).

## Alternativas descartadas

- **Mapbox GL:** exige clave, pesa unos 230 KB y no tiene un círculo con radio en metros.
