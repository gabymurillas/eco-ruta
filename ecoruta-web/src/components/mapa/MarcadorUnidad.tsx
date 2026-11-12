"use client";

import { DivIcon, type Marker as MarcadorLeaflet } from "leaflet";
import { useEffect, useMemo, useRef } from "react";
import { Marker, Popup } from "react-leaflet";
import {
  colorDeRuta,
  colorDeRutaAdaptable,
  glifoSobreColorDeRutaAdaptable,
  necesitaContorno,
  tintaSobreColorDeRuta,
} from "@/domain/colores";
import { svgDeIcono } from "@/domain/iconos";
import { useNombreDeMarcador } from "./useNombreDeMarcador";

type Props = {
  lat: number;
  lng: number;
  nombre: string;
  rutaNombre: string | null;
  color: string | null;
  icono: string | null;
  /** Atenuado y sin halo cuando la unidad dejó de transmitir. */
  transmitiendo: boolean;
  detalle?: string;
  /** Elegida desde otra parte de la pantalla: se resalta y abre su ficha. */
  seleccionado?: boolean;
  alElegir?: () => void;
  /**
   * Web del ciudadano: sigue el modo oscuro del teléfono (colores de ruta más
   * claros, glifo oscuro y aro del color de la superficie). El panel no lo usa:
   * ahí el marcador conserva su tono y su aro crema en los dos temas.
   */
  adaptable?: boolean;
};

const DIAMETRO = 40;

export function MarcadorUnidad({
  lat,
  lng,
  nombre,
  rutaNombre,
  color,
  icono,
  transmitiendo,
  detalle,
  seleccionado = false,
  alElegir,
  adaptable = false,
}: Props) {
  const referencia = useRef<MarcadorLeaflet>(null);
  useNombreDeMarcador(
    referencia,
    [nombre, rutaNombre, transmitiendo ? null : "sin señal"].filter(Boolean).join(", "),
  );
  const marcador = useMemo(
    () => construirMarcador({ color, icono, transmitiendo, seleccionado, adaptable }),
    [color, icono, transmitiendo, seleccionado, adaptable],
  );

  useEffect(() => {
    if (seleccionado) {
      referencia.current?.openPopup();
    }
  }, [seleccionado]);

  return (
    <Marker
      ref={referencia}
      position={[lat, lng]}
      icon={marcador}
      eventHandlers={alElegir ? { click: alElegir } : undefined}
    >
      <Popup>
        <span className="font-serif text-sm font-bold">{nombre}</span>
        {rutaNombre && <span className="block text-xs">{rutaNombre}</span>}
        {detalle && <span className="block text-xs">{detalle}</span>}
      </Popup>
    </Marker>
  );
}

/**
 * El marcador se dibuja como HTML y no como imagen: así hereda los colores de ruta
 * del sistema de diseño sin generar un PNG por cada combinación de color e ícono.
 *
 * El halo pulsante distingue "transmitiendo" de "última posición conocida", que es la
 * diferencia que el gestor necesita ver de un vistazo.
 */
function construirMarcador({
  color,
  icono,
  transmitiendo,
  seleccionado,
  adaptable,
}: Pick<Props, "color" | "icono" | "transmitiendo" | "seleccionado" | "adaptable">): DivIcon {
  const relleno = adaptable ? colorDeRutaAdaptable(color) : colorDeRuta(color);
  const tinta = adaptable ? glifoSobreColorDeRutaAdaptable(color) : tintaSobreColorDeRuta(color);
  const aro = adaptable ? "var(--color-superficie)" : "oklch(99% 0.008 75)";
  const contorno =
    adaptable && necesitaContorno(color) ? "box-shadow:inset 0 0 0 1.5px var(--contorno-mostaza);" : "";
  // Anillo de selección en terracota profundo: marca la interacción, no un estado
  // de la unidad (mismo criterio que la parada elegida en la web del ciudadano).
  const anillo = seleccionado ? "outline:3px solid oklch(48% 0.15 35);outline-offset:1px;" : "";
  const halo = transmitiendo
    ? `<span class="pulso-en-vivo" style="position:absolute;inset:-6px;border-radius:999px;background:${relleno};opacity:.25"></span>`
    : "";

  return new DivIcon({
    className: "",
    iconSize: [DIAMETRO, DIAMETRO],
    iconAnchor: [DIAMETRO / 2, DIAMETRO / 2],
    popupAnchor: [0, -DIAMETRO / 2],
    html: `
      <span style="position:relative;display:flex;width:${DIAMETRO}px;height:${DIAMETRO}px;align-items:center;justify-content:center;opacity:${transmitiendo ? 1 : 0.55}">
        ${halo}
        <span style="position:relative;display:flex;width:${DIAMETRO}px;height:${DIAMETRO}px;align-items:center;justify-content:center;border-radius:999px;background:${relleno};border:3px solid ${aro};color:${tinta};${anillo}${contorno}">
          ${svgDeIcono(icono, 20)}
        </span>
      </span>
    `,
  });
}
