# Auditoría técnica: web del ciudadano (2026-11-12)

Alcance: `src/app/(publico)`, `src/features/seguimiento`, `src/components/mapa`. Norma: WCAG 2.2 AA
(PRODUCT.md) y DESIGN.md. Evidencia: detector de impeccable (URL publicada y vista previa con
datos falsos en 360, 390, 768 y 1280 px), Chrome headless por CDP en claro y oscuro
(`prefers-color-scheme` emulado), toque simulado (`Input.dispatchTouchEvent`), estilos calculados
y cálculo de contraste de los 76 pares de tokens. Sin teléfono físico.

## Puntaje

| # | Dimensión | Puntaje | Hallazgo clave |
|---|---|---|---|
| 1 | Accesibilidad | 2 | Marcadores del mapa sin nombre accesible; crédito del mapa ilegible en oscuro |
| 2 | Rendimiento | 3 | GPS de alta precisión vigilando todo el tiempo |
| 3 | Temas | 3 | Reglas del mapa pisadas por leaflet.css; azul de ubicación fijo |
| 4 | Responsivo | 3 | Sin desbordes; objetivos de 30–40 px bajo los 48 px del proyecto |
| 5 | Integridad | 3 | «min» de 8,8 px; detector: crema y Montserrat son falsos positivos (fijados) |
| **Total** | | **14/20** | **Bueno** |

## Contraste WCAG 2.2 (tokens)

70 de 76 pares pasan en los dos modos. Todos los textos (tinta, media, suave, marca profundo,
error, advertencia) pasan 4,5:1 en claro y oscuro. No pasan, pero no son exigibles:
- Bordes `borde` (2,25:1 claro / 1,65:1 oscuro) y `borde-suave`: los controles que los usan tienen
  texto o ícono que los identifica; WCAG 1.4.11 no exige el borde.
- Círculo mostaza en claro (2,65:1): compensado por el contorno oscuro de 1,5 px.
- Texto `exito` sobre `marca-tenue` (4,40:1): combinación no usada.

## Hallazgos

### P1
1. **Crédito de OpenStreetMap ilegible en modo oscuro.** Fondo calculado `rgba(255,255,255,.8)`
   con texto gris claro (≈1,3:1). `leaflet.css` se carga después de globals.css y pisa
   `.tema-ciudadano .leaflet-control-attribution`. WCAG 1.4.3. Además la atribución es
   obligatoria (ODbL). → subir la especificidad (p. ej. `.tema-ciudadano .leaflet-container
   .leaflet-control-attribution`).
2. **Marcadores sin nombre accesible.** Cada unidad y parada es un `div role="button"
   tabindex="0"` sin `aria-label`: `alt` de react-leaflet solo aplica a íconos de imagen. Un
   lector de pantalla dice «botón». WCAG 4.1.2. → `title`/`aria-label` en el elemento del
   marcador (unidad: «Unidad 03, Centro–UNERG»; parada: nombre).
3. **La hoja baja ya no garantiza ver la próxima llegada.** Con «Cómo llegar» bajo el título, en
   360×740 y un nombre de parada de dos líneas la llegada queda cortada en el borde. La altura
   baja promete «la parada y la llegada más próxima». → llevar «Cómo llegar» a la línea de
   distancia o debajo de la llegada principal.

### P2
4. **Botones de zoom de 30 px.** La regla de 48 px de globals.css pierde contra
   `.leaflet-touch .leaflet-bar a` de leaflet.css (misma causa que el P1-1). Pasa WCAG 2.5.8
   (24 px) pero no los 48 px de PRODUCT.md.
5. **Objetivos de 40 px**: «Cómo llegar», chips de ruta, ✕ del aviso de seguimiento. Mismo
   criterio de 48 px.
6. **«min» de 8,8 px** en las llegadas pequeñas (`text-[0.4em]` de 22 px,
   `ListaLlegadas.tsx:219`). Ilegible con sol. → mínimo 11 px.
7. **Tamaños de letra en px** (`text-[22px]`, `text-[15px]`…): con la letra grande del
   teléfono, los botones (rem) crecen y los títulos no; el nombre de la ruta se trunca a «Ce…».
   WCAG 1.4.4 se cumple con el zoom del navegador, pero no con la preferencia de texto.

### P3
8. **Azul de ubicación fijo** (`CapasDeRuta.tsx:10`): el token `--color-ubicacion` oscuro
   (72 %) no se usa; el punto y el camino a pie no se adaptan al modo oscuro.
9. **GPS de alta precisión continuo** (`vigilarUbicacion`): gasta batería en teléfonos de gama
   baja. → pausar con la página oculta o bajar a precisión normal tras la primera lectura.
10. **Tarjeta dentro de tarjeta** según el detector en 390–768 px (lista de llegadas dentro de
    la hoja con borde).

## Lo que funciona
- Sin desborde horizontal en 360–1280 px, ni con texto al 200 %.
- El asa responde a toque real: 248 → 528 px con un arrastre simulado.
- Modo oscuro coherente: rutas aclaradas con glifo oscuro, teselas invertidas, `#020202`.
- Nunca color solo: cada ruta lleva nombre e ícono; «sin señal» lleva texto y reloj.
- Foco visible en todos los controles propios; `prefers-reduced-motion` respetado.
- Tiempo siempre etiquetado «estimado».

## Re-auditoría tras las correcciones (commit 1a883de)

| # | Dimensión | Antes | Después | Evidencia |
|---|---|---|---|---|
| 1 | Accesibilidad | 2 | 3 | Crédito oscuro con fondo `rgba(18,18,18,.85)`; marcadores con `aria-label` («Unidad 05, Centro–UNERG, sin señal»). Queda: el mapa en sí se recorre con teclado solo marcador por marcador |
| 2 | Rendimiento | 3 | 4 | GPS en vivo se apaga con `visibilitychange` |
| 3 | Temas | 3 | 4 | Zoom y crédito ya no pisados; azul de ubicación del tema |
| 4 | Responsivo | 3 | 4 | Sin desborde 360–1280 y con letra al 200 %; todo lo que se toca ≥ 48 px salvo marcadores del mapa (40 px, contenido del mapa) |
| 5 | Integridad | 3 | 3 | Detector: solo crema y Montserrat (fijados por la autora), texto repetido de datos de prueba, y el aviso de limitaciones como tarjeta (aceptado: aviso de estado) |
| **Total** | | **14/20** | **18/20** | **Excelente** |
