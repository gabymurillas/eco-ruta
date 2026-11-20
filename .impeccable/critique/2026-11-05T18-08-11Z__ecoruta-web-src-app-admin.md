---
target: panel de administración
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/home/analista/ecoruta/ecoruta-web/src/app/admin"
timestamp: 2026-11-05T18-08-11Z
slug: ecoruta-web-src-app-admin
---
# Critique: panel de administración (2026-11-05), por código + ingreso en vivo
Method: dual-agent. Nielsen 26/40 (H1 3, H2 3, H3 2, H4 3, H5 3, H6 2, H7 2, H8 3, H9 2, H10 3).
Detector /admin/ingreso: 4 low-contrast (tinta-suave en etiquetas y placeholders, 3,5:1), 1 straggler, cream-palette (falso positivo).
## Problemas prioritarios
- [P1] Mapa y lista desconectados, sin leyenda de rutas (LienzoFlota.tsx, TarjetaUnidad no interactiva). → layout/clarify
- [P1] Errores de carga sin salida en todas las páginas del panel; texto con «Supabase» en parametros. → harden
- [P1] Contraste: tinta-suave 3,55:1 en etiquetas; bordes de campo 1,54:1 (WCAG 1.4.11). → audit
- [P2] KPI engañosos: «Unidades activas» = registradas; Incidencias sin tono de advertencia (page.tsx:86-100). → clarify/polish
- [P2] Tabla de unidades: botones de ~26 px, confirmación sin mover foco, cancelar dice «No». → audit/harden
- [P3] Formulario de ruta: colores usados no marcados, íconos «camion», aria-label «Color teal». → polish
## Menores
Cabecera de tabla en marca-tenue; botones h-10; foto del ingreso muestra sobre todo cielo; MapaPendiente.tsx código muerto; sin aviso «usa una computadora» bajo md; sin beforeunload en el editor de trazado.
