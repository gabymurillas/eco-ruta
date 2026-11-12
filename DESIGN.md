---
name: EcoRuta San Juan
description: Seguimiento en vivo de rutas de transporte y aseo en San Juan de los Morros
colors:
  crema-base: "oklch(97% 0.015 75)"
  crema-elevada: "oklch(99% 0.008 75)"
  borde-arena: "oklch(74% 0.025 60)"
  borde-arena-suave: "oklch(83% 0.02 60)"
  borde-campo: "oklch(63% 0.02 60)"
  tinta-tierra: "oklch(25% 0.02 60)"
  tinta-tierra-media: "oklch(48% 0.02 60)"
  tinta-tierra-suave: "oklch(53% 0.02 60)"
  terracota-morros: "oklch(58% 0.17 35)"
  terracota-profundo: "oklch(48% 0.15 35)"
  terracota-tenue: "oklch(95% 0.03 35)"
  ruta-teal: "oklch(52% 0.1 208)"
  ruta-mostaza: "oklch(70% 0.14 75)"
  ruta-ciruela: "oklch(48% 0.13 340)"
  ruta-oliva: "oklch(50% 0.13 140)"
  ruta-indigo: "oklch(48% 0.12 265)"
  estado-en-vivo: "oklch(52% 0.13 155)"
  estado-advertencia: "oklch(68% 0.15 70)"
  estado-advertencia-fondo: "oklch(96% 0.04 75)"
  estado-advertencia-borde: "oklch(82% 0.09 75)"
  estado-advertencia-tinta: "oklch(42% 0.09 70)"
  estado-error: "oklch(48% 0.19 25)"
  estado-info: "oklch(52% 0.12 240)"
  ubicacion-ciudadano: "oklch(55% 0.15 250)"
typography:
  display:
    fontFamily: "Montserrat, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Montserrat, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 900
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Montserrat, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 900
    letterSpacing: "-0.025em"
  subtitle:
    fontFamily: "Montserrat, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 700
  body:
    fontFamily: "Montserrat, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  body-small:
    fontFamily: "Montserrat, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Montserrat, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    letterSpacing: "0.025em"
rounded:
  campo: "10px"
  tarjeta: "12px"
  panel: "16px"
  hoja: "20px"
  pill: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
components:
  button-primary:
    backgroundColor: "{colors.terracota-profundo}"
    textColor: "{colors.crema-elevada}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "48px"
  button-secondary:
    backgroundColor: "{colors.crema-elevada}"
    textColor: "{colors.tinta-tierra}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "48px"
  button-secondary-hover:
    backgroundColor: "{colors.terracota-tenue}"
  button-ghost:
    textColor: "{colors.terracota-profundo}"
    rounded: "{rounded.pill}"
    height: "48px"
  card:
    backgroundColor: "{colors.crema-elevada}"
    rounded: "{rounded.tarjeta}"
    padding: "16px"
  card-warning:
    backgroundColor: "{colors.estado-advertencia-fondo}"
    rounded: "{rounded.tarjeta}"
    padding: "16px"
  input:
    backgroundColor: "{colors.crema-elevada}"
    textColor: "{colors.tinta-tierra}"
    rounded: "{rounded.campo}"
    height: "48px"
    padding: "0 14px"
  toast:
    backgroundColor: "{colors.crema-elevada}"
    textColor: "{colors.tinta-tierra}"
    rounded: "{rounded.pill}"
  unit-marker:
    rounded: "{rounded.pill}"
    size: "40px"
---

# Design System: EcoRuta San Juan

## Overview

**Creative North Star: "El mapa de la ciudad al atardecer"**

EcoRuta se ve como San Juan de los Morros a última hora de la tarde: crema cálido, terracota de
los Morros y un mapa que ocupa el escenario mientras todo lo demás se retira. El mapa es el
contenido. Las rutas lo cruzan con cinco tonos que se distinguen a simple vista, y las cifras de
tiempo estimado se leen en Montserrat gruesa, grande, que se entiende con sol directo.

El carácter es **cálido, local y sobrio**. Cálido, por la paleta tierra.
Local, porque la única fotografía es el atardecer sobre los Morros y la voz tutea al vecino.
Sobrio, porque no hay sombras, degradados ni glassmorphism: la profundidad sale de capas tonales
y de bordes finos de 1 px. Los componentes son **suaves y amables**, con esquinas generosas,
pills, fondos tenues y transiciones lentas, sin rebote.

Se rechaza explícitamente lo corporativo y genérico (Inter, Roboto, azul SaaS), el color de
marca usado como dato y la foto de identidad detrás de cualquier pantalla con mapa o datos.

**Key Characteristics:**
- Mapa protagonista; la interfaz flota sobre él en superficies crema planas.
- Tres paletas con funciones que no se mezclan: marca, ruta y estado.
- Una sola familia, Montserrat, para títulos, cifras y texto (decisión de la autora, 2026-11-11).
- Plano por defecto: borde de 1 px bien marcado, sin sombras.
- Modo oscuro en la web del ciudadano (sigue al teléfono): fondo #020202 y grises neutros.
- Pensado para teléfonos de gama baja, con sol y con prisa: 48 px táctiles y contraste AA.

## Colors

Paleta tierra sobre crema, con un único acento de identidad y dos vocabularios funcionales
(ruta y estado) que nunca se confunden con él.

### Primary
- **Terracota de los Morros** (oklch(58% 0.17 35)): identidad. Logo, acentos de navegación y
  texto de marca sobre crema. Con texto blanco encima da 3.4:1 y **no** cumple AA.
- **Terracota profundo** (oklch(48% 0.15 35)): todo relleno con texto blanco encima (botón
  primario: 4.8:1) y el anillo de foco.
- **Terracota tenue** (oklch(95% 0.03 35)): hover de botones secundarios y fantasma, y tarjetas
  de tono marca.

### Secondary: colores de ruta
El admin asigna uno por ruta. Se distinguen **por tono, no por saturación**. Ajuste del
2026-11-11: el teal pasó a oklch(52% 0.1 208) (con croma 0,11 y tono 195 quedaba fuera de la
gama sRGB y se recortaba), el oliva ganó croma y la mostaza lleva un contorno oscuro de 1,5 px
en la web del ciudadano para separarse de la crema.
- **Teal de río** (oklch(52% 0.11 195)): tono por defecto cuando el valor falta o es desconocido.
- **Mostaza de mercado** (oklch(70% 0.14 75)): el único claro; su ícono va en tinta oscura.
- **Ciruela** (oklch(48% 0.13 340))
- **Oliva de sabana** (oklch(50% 0.1 145))
- **Índigo nocturno** (oklch(48% 0.12 265))

### Tertiary: colores de estado
- **Verde en vivo** (oklch(52% 0.13 155)): transmitiendo, éxito.
- **Ámbar de aviso** (oklch(68% 0.15 70)), con fondo (oklch(96% 0.04 75)), borde
  (oklch(82% 0.09 75)) y tinta (oklch(42% 0.09 70)) propios: batería baja, limitaciones.
- **Rojo profundo** (oklch(48% 0.19 25)): error y sin señal. Más oscuro y saturado que el
  terracota, para que se vean distintos lado a lado.
- **Azul información** (oklch(52% 0.12 240)): información.
- **Azul ubicación** (oklch(55% 0.15 250)): exclusivo del punto del ciudadano.

### Neutral
- **Crema base** (oklch(97% 0.015 75)): fondo de toda página.
- **Crema elevada** (oklch(99% 0.008 75)): tarjetas, campos y paneles sobre el mapa.
- **Borde arena** (oklch(74% 0.025 60)) y **arena suave** (oklch(83% 0.02 60)): contornos y
  divisores, siempre de 1 px. Antes eran de 0,5 px y más claros, y con sol se perdían: la autora
  pidió recuadros más marcados (2026-11-11).
- **Borde de campo** (oklch(63% 0.02 60)): solo el contorno de campos de formulario. Es lo que
  dice «aquí se escribe», así que llega a 3:1 sobre crema (WCAG 1.4.11).
- **Tinta tierra** (oklch(25% 0.02 60)), **media** (oklch(48% 0.02 60)) y **suave**
  (oklch(53% 0.02 60)): texto principal, secundario y etiquetas. La tinta suave se reserva para
  etiquetas cortas y placeholders, y cumple 4,5:1 sobre todos los fondos claros del sistema
  (el peor es el terracota tenue: 4,52:1). Antes era 62 % y se quedaba en 3,1–3,55:1.

### Modo oscuro (web del ciudadano)
Sigue la preferencia del teléfono (`prefers-color-scheme`) y vive en `.tema-ciudadano` de
globals.css. Fondo **#020202**, superficies **#121212**, bordes **#3a3a3a** / **#262626**, tinta
clara cálida. Las rutas se aclaran manteniendo el tono y su ícono pasa a tinta oscura
(`--glifo-ruta`); las teselas del mapa se invierten con un filtro. El panel tiene su propio tema.

### Named Rules
**The Three Palettes Rule.** El color de marca nunca es color de ruta ni de estado. Si se
mezclan, el sistema deja de comunicar.

**The Never Alone Rule.** El color nunca es el único portador de significado: cada ruta muestra
su nombre y cada marcador su ícono.

**The Deep Fill Rule.** Todo relleno con texto blanco usa terracota profundo, nunca el tono de
marca.

## Typography

**Font:** Montserrat (with system-ui, sans-serif), para todo. En el panel de administración se
usa Figtree.

**Character:** una sola familia geométrica y gruesa, elegida por la autora (2026-11-11). La
jerarquía sale del peso y el tamaño: las cifras de tiempo estimado van en 800 y grandes para
entenderse en la calle. Reemplaza a Merriweather + Source Sans 3. En el código el rol de
títulos se sigue llamando `serif` (`--font-serif`), pero apunta a Montserrat.

### Hierarchy
- **Display** (800, 40px, 1): cifra principal de tiempo estimado; 22 px en el resto de la lista.
- **Headline** (800, 22–24px, 1.25, −0.025em): título de pantalla o de vista de parada.
- **Title** (800, 19px, −0.025em): nombre de ruta o de unidad en tarjetas.
- **Subtitle** (700, 15px): nombres secundarios dentro de listas.
- **Body** (400, 15px, 1.5): texto de interfaz y botones (estos en 700).
- **Body small** (400, 13px): metadatos, avisos flotantes y última señal.
- **Label** (700, 12px, 0.025em): etiquetas de campo. En sentence case, nunca en mayúsculas.

### Named Rules
**The Sentence Case Rule.** Todo texto visible va en sentence case. Nunca TODO MAYÚSCULAS.

**The No Default Fonts Rule.** Nada de Inter, Roboto, Open Sans ni la fuente del sistema como
primera opción.

## Layout

El ciudadano es mobile-first: cabecera delgada (EcoRuta a la izquierda, «En vivo» a la
derecha), mapa a pantalla completa y una hoja inferior de tres alturas: baja (la parada y la
llegada más próxima), media (todas las llegadas y las rutas) y alta (además, cambiar de parada y
las limitaciones). Se arrastra desde el asa; tocarla o usar las flechas hace lo mismo. En
escritorio la hoja es una columna fija de 440 px a la derecha del mapa. Bocetos aprobados:
`.impeccable/mocks/ciudadano/`.

Ajustes de la auditoría del 2026-11-12 (`.impeccable/audit/ciudadano-2026-11-12.md`):
- **La hoja baja garantiza la llegada más próxima.** «Cómo llegar» vive en la línea de
  distancia («A 180 m · 2 min a pie · Cómo llegar»), no en una fila propia.
- **Las llegadas secundarias son filas separadas por una línea**, no tarjetas: la hoja ya es
  la superficie. «Sin señal» se distingue por su texto y su reloj. La tarjeta de advertencia
  de limitaciones sí se queda: es un aviso de estado, no un contenedor.
- **Objetivos táctiles de 48 px en todo lo que se toca** (chips, botones de texto, zoom del
  mapa, ✕ del aviso de seguimiento), con margen negativo cuando no deben agrandar la línea.
- **Tamaños de letra en rem en la web del ciudadano**, para seguir la letra grande del
  teléfono; nada funcional por debajo de 11 px. Los nombres de ruta pasan a dos líneas en vez
  de truncarse.
- **El azul de ubicación sale del tema** (`--color-ubicacion`, clases `ubicacion-*`): en oscuro
  se aclara como el resto. El admin es escritorio: barra de navegación más mapa de flota con columna de tarjetas.
El espaciado va en múltiplos de 4 px (4, 8, 12, 16, 20, 24). Los puntos de quiebre son los de
Tailwind (sm 640 px, md 768 px, lg 1024 px). La foto de los Morros solo aparece en el panel
derecho del ingreso del admin a partir de escritorio.

## Elevation & Depth

Sistema **plano**. No hay sombras ni degradados. La profundidad se comunica con capas tonales
(crema base debajo, crema elevada encima) y con un borde arena de 1 px. El mapa es la capa más
baja; los paneles flotan sobre él solo por tono y contorno. Única excepción documentada: la
bienvenida de la app Android usa un degradado para fundir la foto con el fondo.

### Named Rules
**The Flat Rule.** Si algo necesita destacar, sube de tono o gana un borde de estado; nunca una
sombra.

## Shapes

Formas suaves y amables: pills (999 px) en botones, chips y avisos flotantes; 10 px en campos;
12 px en tarjetas; 16 px en paneles; 20 px en las hojas inferiores. Los marcadores de unidad son
círculos con un aro crema de 3 px.

## Components

### Buttons
- **Shape:** pill (999px), alto de 48 px y ancho mínimo de 48 px.
- **Primary:** terracota profundo con texto crema elevada, 15 px en 700. Hover: brillo +10 %.
- **Secondary:** crema elevada con borde arena de 1 px. Hover: terracota tenue.
- **Ghost:** texto terracota profundo sin fondo. Hover: terracota tenue.
- **Focus:** contorno de 2 px en terracota profundo con separación de 2 px. Transiciones de
  300 ms ease-out.

### Chips (chip de ruta)
- **Style:** punto del color de la ruta más su nombre. **Nunca** el punto solo.
- **State:** el activo lleva un fondo tenue del mismo tono de la ruta.

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** crema elevada; el tono marca usa terracota tenue y el de advertencia, la
  terna ámbar.
- **Shadow Strategy:** ninguna (ver Elevation).
- **Border:** 1 px arena; rojo de error en la tarjeta de unidad sin señal; ámbar con batería
  baja.
- **Internal Padding:** 16px.

### Inputs / Fields
- **Style:** 48 px de alto, radio de 10 px, crema elevada, borde arena de 1 px, texto de 15 px
  en 600.
- **Focus:** contorno de 2 px en terracota profundo.
- **Error:** borde rojo y mensaje con `role="alert"` asociado por `aria-describedby`.

### Navigation
Admin: menú superior con acentos terracota en el ítem activo. Ciudadano: sin menú; un solo flujo
(mi parada).

### Marcador de unidad (signature)
Círculo de 40 px en el color de su ruta, con el ícono del servicio (bus, camión, cisterna, van o
genérico) en blanco, o en tinta oscura sobre mostaza. Lleva un halo pulsante de 2 s mientras
transmite; sin señal pierde el halo y baja a 55 % de opacidad.

### Ubicación del ciudadano (signature)
Punto azul de ubicación con un aro de precisión pulsante. Ninguna otra cosa usa ese azul.

### Aviso flotante
Pill crema con borde de estado (verde o rojo), ✓ o !, texto en tinta y botón de cerrar de 32 px.
La región `role="status"` existe siempre.

## Do's and Don'ts

### Do:
- **Do** usar terracota profundo (oklch(48% 0.15 35)) en todo relleno con texto blanco.
- **Do** acompañar cada color de ruta con su nombre y cada marcador con su ícono.
- **Do** mantener objetivos táctiles de 48 px como mínimo y foco visible en todo control.
- **Do** usar ease-out de 300–500 ms y desactivar la animación con `prefers-reduced-motion`.
- **Do** colocar la foto de los Morros solo en zonas de identidad (ingreso del admin, Open Graph,
  portada) y el texto a su lado, nunca encima.

### Don't:
- **Don't** usar el terracota para representar una ruta o un estado.
- **Don't** agregar sombras, degradados ni glassmorphism en la web.
- **Don't** poner la foto detrás de mapas, monitoreo, tablas, alertas ni estados vacíos.
- **Don't** usar Inter, Roboto, Open Sans ni fuentes por defecto del sistema.
- **Don't** escribir textos en TODO MAYÚSCULAS ni usar rebote en las animaciones.
- **Don't** usar el azul de ubicación para nada que no sea el ciudadano.
