# Recursos

Fotografía de identidad: atardecer sobre los Morros de San Juan. Foto propia de la autora del
proyecto, ampliada ×4 con Real-ESRGAN a partir de la captura original.

| Archivo | Tamaño | Uso |
|---|---|---|
| `morros-atardecer.jpg` | 3312 × 3312 | Original de trabajo. De aquí salen todos los recortes; no se publica. |
| `morros-panoramico-21x9.jpg` | 2400 × 1028 | Hero de la landing, cuando exista. |
| `morros-bienvenida-android.webp` | 960 × 1200 | Pantalla de bienvenida de la app de la ruta. Va en `res/drawable-nodpi/morros_bienvenida.webp`. |
| `morros-fondo-kiosco-1440x3200.jpg` | 1440 × 3200 | Fondo de pantalla del teléfono de la unidad (se ve si la app sale del modo kiosco). |

Los recortes que ya consume la web no están aquí sino en su sitio:

- `ecoruta-web/src/assets/morros-atardecer.jpg`: panel del ingreso del admin. Se importa de forma
  estática para que `next/image` conozca sus medidas y genere el placeholder.
- `ecoruta-web/src/app/opengraph-image.jpg`: vista previa al compartir el enlace (1200 × 630).

Dónde va la foto y dónde no está en `CLAUDE.md` § Sistema de diseño › Fotografía.
