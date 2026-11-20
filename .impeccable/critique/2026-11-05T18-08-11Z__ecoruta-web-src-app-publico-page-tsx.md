---
target: web del ciudadano
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:/home/analista/ecoruta/ecoruta-web/src/app/(publico)/page.tsx"
target_fingerprint: "sha256:136cf57542f3dbeba92ec5f3eb7d8101e52860bb6bdaaffce90c229e5d1f7a34"
target_path: /home/analista/ecoruta/ecoruta-web/src/app/(publico)/page.tsx
timestamp: 2026-11-05T18-08-11Z
slug: ecoruta-web-src-app-publico-page-tsx
---
# Critique: web del ciudadano (2026-11-05)
Method: dual-agent. Nielsen 26/40 (H1 2, H2 3, H3 3, H4 3, H5 3, H6 3, H7 2, H8 2, H9 2, H10 3).
Detector: código limpio; por URL 2 low-contrast (#90847a, tinta-suave, 3,3-3,5:1) y cream-palette (falso positivo, elección del sistema).
## Problemas prioritarios
- [P0] El tiempo estimado nunca se muestra: ListaLlegadas.tsx:120-132 dice «En camino» en las dos ramas; calcularEtaEstimadoMinutos (domain/eta.ts) existe pero no está conectado. Además usa terracota como estado. → typeset/bolder
- [P1] Fallas silenciosas: useLlegadas ignora errores; ListaLlegadas afirma «no hay unidades» mientras carga; Seguimiento.tsx fase cargando = null (hoja en blanco en 3G). → harden
- [P1] tinta-suave no cumple AA (3,1-3,55:1) en metadatos, etiquetas, nota de privacidad. → audit/colorize
- [P2] Mapa de 224 px encajonado, aviso «Antes de empezar» entre parada y mapa, controles Leaflet de 30 px. → layout/distill
- [P2] Ubicación negada sin reintento; escritorio sin ancho máximo. → harden/adapt
## Menores
Tarjeta de parada salmón (marca-tenue); borde info de 1 px; datos de prueba visibles («traki»); sin indicador en vivo en estado vacío; «Sin unidad en vivo» repetido.
