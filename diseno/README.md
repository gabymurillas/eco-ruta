# Diseño

Maquetas de las dos superficies web, en el sistema de diseño v2 (ver `CLAUDE.md`).

```
diseno/
├── usuario/   ← web del ciudadano, 5 pantallas
└── admin/     ← web de administración, 6 pantallas
```

## Qué son estos archivos

Cada `.dc.html` es una pantalla completa y autónoma: se abre en cualquier navegador y se ve tal
cual. No dependen de compilación ni de librerías externas; los colores están en `oklch()` con los
mismos valores que documenta `CLAUDE.md`, y las tipografías se cargan desde Google Fonts.

`canvas.json` es solo la disposición de las pantallas sobre el lienzo (posición, título, notas).
No afecta a cómo se ve cada pantalla por separado.

## Pantallas

**Usuario** — `Main` (seguimiento por parada más cercana), `RutaDetalle`, `AlertaProximidad`,
`SinUnidades`, `Escritorio`.

**Admin** — `Main` (monitoreo en vivo), `RutaEditar` (trazado, color, ícono, geocercas),
`Historicos`, `Parametros`, `Unidades` (vinculación de dispositivos), `Ingreso`.

## Relación con el código

Son la referencia visual, no la fuente de verdad del código. Los valores de color viven en
`ecoruta-web/src/app/globals.css` (tokens) y en `ecoruta-web/src/domain/colores.ts` (tonos de
ruta). Si cambia el sistema de diseño, se actualizan los tres: `CLAUDE.md`, los tokens y estas
maquetas.

Los datos que aparecen (unidades, tiempos, distancias) son de ejemplo, salvo la ruta
Centro–UNERG y sus tres paradas, que sí existen en la base de datos.
