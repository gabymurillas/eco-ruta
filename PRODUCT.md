# Product

<!-- impeccable:product-schema 1 -->

> Registro durable del producto para agentes y personas. Lo escribió el flujo `init` de
> impeccable a partir de la entrevista con la autora (2026-11-04). El detalle de requisitos
> vive en [`docs/02-producto/PRD.md`](docs/02-producto/PRD.md); este archivo guarda solo la
> verdad del producto que no cambia de una tarea a otra.

## Platform

web

> Este repositorio contiene las dos superficies web (ciudadano y administración) y el backend.
> La app del dispositivo de ruta es Android nativo y vive en otro repositorio, con su propio
> sistema visual derivado de este.

## Users

**Ciudadano (primario, sin cuenta).** Persona en San Juan de los Morros (estado Guárico,
Venezuela) que abre la web desde un teléfono de gama baja con datos móviles limitados, a menudo
en la calle y con sol. Tres situaciones confirmadas:

- **Pasajero diario:** trabajador o estudiante que espera el bus en la parada y quiere saber si
  ya viene o si ya pasó.
- **Hogar que espera el aseo:** quiere sacar la basura cuando el camión se acerca, no antes.
- **Visitante o estudiante foráneo:** no conoce las rutas de la ciudad.

**Administrador del ente gestor.** Funcionario de la alcaldía (objetivo: Alcaldía del municipio
Juan Germán Roscio; sin acuerdo formal todavía). Configura rutas, paradas y unidades, vincula
teléfonos, calibra parámetros y monitorea la flota en vivo desde escritorio. Un solo rol.

**Chofer (indirecto).** No tiene cuenta ni perfil. Opera el teléfono dedicado de la unidad con
dos botones (iniciar y finalizar recorrido) y puede reportar incidencias. El sistema no lo evalúa.

## Product Purpose

Hoy en San Juan de los Morros nadie sabe cuándo pasa el bus o el camión de aseo: se espera y se
adivina, o se depende de grupos de WhatsApp. EcoRuta transmite la posición de cada unidad en
vivo, calcula un tiempo estimado de llegada a la parada del ciudadano y le avisa en pantalla
cuando la unidad **se acerca** y cuando **ya pasó**.

El servicio prioritario es el **transporte público**; la recolección de desechos es el segundo
servicio, y el modelo admite otros (agua, gas) sin cambiar el esquema.

Es un proyecto de grado (UNERG, Ingeniería en Informática) con defensa antes de fin de 2026. Su
continuidad después de la tesis está **sin decidir**.

Éxito significa: tiempo estimado preciso, avisos correctos (sin duplicados ni falsos positivos)
y adopción ciudadana.

## Positioning

- **El teléfono pertenece a la ruta, no al chofer.** Un Android barato dedicado, enchufado al
  vehículo y en modo kiosco, reemplaza el hardware GPS por unidad. No depende de que cada chofer
  instale nada en su teléfono personal.
- **El ciudadano no instala nada ni crea cuenta.** Las geocercas se evalúan en el servidor
  contra la posición de la unidad, no contra la del ciudadano.
- **Hecho para la conectividad real de Venezuela:** buffer offline en el dispositivo, mapas
  ligeros (Leaflet, unos 42 KB) y ninguna dependencia de Google Play Services en el ciudadano.

## Operating Context

- El ciudadano consulta con prisa, de pie, con sol directo, con señal intermitente y con cortes
  eléctricos frecuentes en la ciudad.
- Las unidades de transporte no esperan en la parada: por eso no existe el aviso «está en tu
  parada», solo «se acerca» y «ya pasó».
- El admin trabaja en escritorio, con el mapa de la flota como pantalla principal.
- Los avisos solo llegan con la página abierta (sin notificaciones push); esa limitación se le
  explica una vez al ciudadano.

## Capabilities and Constraints

- Ciudadano: «mi parada» sale de la ubicación (la más cercana se preselecciona y se puede
  cambiar), se recuerda solo en el navegador y recibe avisos por Realtime. Sin ubicación se
  muestra un mensaje; **no hay elección manual de ruta ni de parada, y es una decisión
  definitiva**.
- Planificado: portada (landing) y detalle de ruta (`/ruta/[id]`).
- Tiempo estimado: hoy es distancia sobre el trazado ÷ velocidad reciente. Dentro de la tesis se
  agrega una versión mínima que usa el historial por franja horaria, con respaldo al cálculo
  simple cuando no hay datos.
- Fuera de alcance: notificaciones push, cuentas de ciudadano, iOS, pagos y boletería.
- Exposición: una unidad es visible al público **solo durante un viaje activo**; nunca se
  identifica al chofer.
- Retención: la telemetría cruda se conserva 90 días; los agregados, indefinidamente.
- Costos: planes gratuitos (Supabase, Vercel) durante la tesis.
- Terminología: siempre «tiempo estimado» o «ETA estimado», nunca «predictivo». Unidad, ruta,
  parada y viaje son términos del dominio.

## Brand Commitments

- Nombre: **EcoRuta San Juan**, de la autora.
- Voz: **tú, cercano y directo** («Tu bus llega en 6 min»). Español, sentence case, nunca TODO
  MAYÚSCULAS, sin tecnicismos.
- Personalidad: cálida, local y sobria. Cercana y local, no corporativa ni genérica.
- Activo de identidad: foto propia del atardecer sobre los Morros de San Juan
  (`diseno/recursos/`).
- El color de marca nunca representa una ruta ni un estado.

## Evidence on Hand

- Maquetas de 11 pantallas en `diseno/` (5 del ciudadano y 6 del admin).
- Web desplegada en Vercel: `eco-ruta-nine.vercel.app`.
- La ruta Centro–UNERG y sus tres paradas existen en la base.
- Análisis de factibilidad (julio de 2026): `Analisis_Factibilidad_EcoRuta.pdf`.
- **No hay todavía:** viajes reales grabados (solo simulados y una prueba estática), prueba de
  campo de GPS, usuarios reales, testimonios, métricas de uso ni acuerdo institucional. No se
  deben inventar.

## Product Principles

1. **La verdad antes que la apariencia.** Un tiempo estimado se llama estimado; una unidad sin
   señal se muestra sin señal. Un dato equivocado destruye la confianza más que un dato ausente.
2. **Cero fricción para el ciudadano.** Sin cuenta, sin instalación, sin configuración: abrir y
   ver la parada.
3. **Diseñado para la conectividad que existe.** Datos móviles caros, cortes de luz y teléfonos
   de gama baja son el caso normal, no el borde.
4. **Proteger a quien opera.** Ningún dato expone al chofer; las unidades solo se ven en servicio.
5. **Explicable.** Cada decisión técnica tiene que poder defenderse ante un jurado.

## Accessibility & Inclusion

- WCAG 2.2 AA como mínimo: 4.5:1 en texto y 3:1 en elementos de interfaz.
- El color nunca es el único portador de significado (nombre de ruta e ícono siempre presentes),
  pensando en el daltonismo rojo-verde.
- Objetivos táctiles de 48 px como mínimo; foco visible; `prefers-reduced-motion` respetado.
- Lectura de un vistazo bajo el sol: cifras grandes en serif de alto contraste.
