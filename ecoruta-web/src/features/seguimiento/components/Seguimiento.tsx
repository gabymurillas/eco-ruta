"use client";

import dynamic from "next/dynamic";
import { Boton } from "@/components/ui/Boton";
import { useCamaraDelMapa } from "../hooks/useCamaraDelMapa";
import { useLlegadas, type EstadoLlegadas } from "../hooks/useLlegadas";
import { useMiParada, type Fase } from "../hooks/useMiParada";
import { useTrazados } from "../hooks/useTrazados";
import { useUbicacionViva } from "../hooks/useUbicacionViva";
import { hayUnidadEnVivo, paradasDelMapa, unidadesDelMapa } from "../mapa-de-seguimiento";
import { ContextoSeguirRuta } from "../seguir-ruta";
import type { ParadaConRutas, ParadaElegida } from "../types";
import { Bienvenida } from "./Bienvenida";
import { Cabecera } from "./Cabecera";
import { AvisoSiguiendo, BotonMiUbicacion } from "./ControlesDelMapa";
import { EstadoSinUbicacion } from "./EstadoSinUbicacion";
import { HojaInferior } from "./HojaInferior";
import { ParadaMasLejos } from "./ParadaMasLejos";
import { SelectorDeParada } from "./SelectorDeParada";
import { VistaParada } from "./VistaParada";

/**
 * Leaflet toca `window` al importarse, así que el lienzo queda fuera del render del
 * servidor. En Next 16 `ssr: false` solo se permite dentro de un componente cliente,
 * y este lo es.
 */
const LienzoSeguimiento = dynamic(
  () => import("./LienzoSeguimiento").then((modulo) => modulo.LienzoSeguimiento),
  {
    ssr: false,
    loading: () => (
      <div className="flex size-full items-start justify-center bg-fondo pt-10">
        <p className="text-sm text-tinta-media">Cargando el mapa…</p>
      </div>
    ),
  },
);

type Props = {
  umbralSinSenalS: number;
  radioAproximacionM: number;
  penalizacionIncidenciaPct: number;
};

/**
 * Mapa a pantalla completa, una cabecera delgada arriba y la hoja de tres
 * alturas encima (en escritorio, una columna a la derecha). El mapa está en
 * todas las fases: antes de tener parada muestra la ciudad.
 */
export function Seguimiento(props: Props) {
  const miParada = useMiParada();
  const { fase, ubicacion } = miParada;
  const parada = fase.tipo === "parada" ? fase.parada : null;
  const llegadas = useLlegadas(parada?.paradaId ?? null);
  const trazados = useTrazados(parada ? parada.rutas.map((ruta) => ruta.rutaId) : []);
  const otras = miParada.cercanas?.ok ? miParada.cercanas.datos : [];
  const ubicacionViva = useUbicacionViva(ubicacion.estado === "concedida" ? ubicacion.ubicacion : null);
  const filas = llegadas.llegadas ?? [];
  const camaraDelMapa = useCamaraDelMapa(parada?.paradaId ?? null, filas, props);
  const { camara, seguida } = camaraDelMapa;

  return (
    <div className="tema-ciudadano flex h-dvh flex-col overflow-hidden bg-fondo text-tinta">
      <Cabecera
        enVivo={parada !== null && hayUnidadEnVivo(llegadas.llegadas, llegadas.falla, props.umbralSinSenalS)}
      />

      <main className="relative flex min-h-0 flex-1">
        <div className="absolute inset-0 lg:relative lg:flex-1">
          <LienzoSeguimiento
            ubicacion={ubicacionViva}
            paradas={parada ? paradasDelMapa(parada, otras) : []}
            unidades={parada ? unidadesDelMapa(filas, props.umbralSinSenalS) : []}
            trazados={trazados}
            camara={camara}
            rutaSeguidaId={seguida?.rutaId ?? null}
            unidadSeguidaId={seguida?.unidadId ?? null}
            alMoverAMano={camaraDelMapa.alMoverAMano}
          />

          {parada && seguida && (
            <div className="absolute top-7 left-14 z-[1050] lg:top-3 max-w-[calc(100%-4.25rem)] lg:max-w-md">
              <AvisoSiguiendo
                ruta={rutaDe(parada, seguida.rutaId)}
                unidadNombre={filas.find((fila) => fila.unidad_id === seguida.unidadId)?.unidad_nombre ?? null}
                suelto={camara.modo !== "ruta"}
                alVolver={camaraDelMapa.volverALaRuta}
                alCerrar={camaraDelMapa.dejarDeSeguir}
              />
            </div>
          )}
        </div>

        {/* La clave reinicia la altura al cambiar de fase: con parada abre abajo,
            para ver el mapa; lo demás abre a media altura, para leerse entero. */}
        <HojaInferior
          key={fase.tipo}
          nivelInicial={fase.tipo === "parada" ? "baja" : "media"}
          etiqueta={parada ? `Tu parada: ${parada.nombre}` : "Tu parada"}
          flotante={
            ubicacionViva && (
              <BotonMiUbicacion
                activo={camara.modo === "ubicacion"}
                alTocar={camaraDelMapa.irAMiUbicacion}
              />
            )
          }
        >
          <ContextoSeguirRuta.Provider value={{ seguida, seguir: camaraDelMapa.seguir }}>
            <Contenido miParada={miParada} llegadas={llegadas} {...props} />
          </ContextoSeguirRuta.Provider>
        </HojaInferior>
      </main>
    </div>
  );
}

type PropsContenido = Props & {
  miParada: ReturnType<typeof useMiParada>;
  llegadas: EstadoLlegadas;
};

function Contenido({ miParada, llegadas, ...ajustes }: PropsContenido) {
  const { fase, cercanas, elegida } = miParada;

  // Si el ciudadano ya tiene parada, cualquier pantalla intermedia (buscar,
  // elegir, ubicación negada) le deja volver a ella.
  const volver = elegida ? miParada.cerrarSelector : null;

  switch (fase.tipo) {
    // Es lo que llega en el HTML del servidor: con mala señal se ve hasta que
    // termina de bajar el JavaScript, así que no puede ser una hoja en blanco.
    case "cargando":
      return (
        <p className="text-sm text-tinta-media" role="status">
          Cargando tu parada…
        </p>
      );

    case "bienvenida":
    case "buscando":
      return elegida ? (
        <p className="text-sm text-tinta-media">Buscando paradas cerca de ti…</p>
      ) : (
        <Bienvenida
          buscando={fase.tipo === "buscando"}
          radioAproximacionM={ajustes.radioAproximacionM}
          alUsarUbicacion={miParada.pedirUbicacion}
        />
      );

    case "sin_ubicacion":
    case "sin_paradas":
    case "error":
      return (
        <Contratiempo
          fase={fase}
          alVolver={volver}
          alElegir={miParada.elegir}
          alReintentar={miParada.pedirUbicacion}
        />
      );

    case "selector":
      return (
        <SelectorDeParada
          paradas={fase.paradas}
          elegidaId={elegida?.paradaId ?? null}
          alElegir={miParada.elegir}
          alCancelar={volver}
        />
      );

    case "parada":
      return (
        <VistaParada
          parada={fase.parada}
          otrasParadas={cercanas?.ok ? cercanas.datos : []}
          llegadas={llegadas}
          {...ajustes}
          alCambiar={miParada.abrirSelector}
          alElegir={miParada.elegir}
        />
      );
  }
}

type FaseContratiempo = Extract<Fase, { tipo: "sin_ubicacion" | "sin_paradas" | "error" }>;

/** Lo que impide mostrar paradas. Si ya tenía una, puede volver a ella. */
function Contratiempo({
  fase,
  alVolver,
  alElegir,
  alReintentar,
}: {
  fase: FaseContratiempo;
  alVolver: (() => void) | null;
  alElegir: (parada: ParadaConRutas) => void;
  alReintentar: () => void;
}) {
  return (
    <>
      {fase.tipo === "error" ? (
        <p className="text-sm text-error" role="alert">
          {fase.mensaje}
        </p>
      ) : (
        <EstadoSinUbicacion motivo={fase.tipo === "sin_paradas" ? "sin_paradas" : fase.motivo} />
      )}

      {fase.tipo === "sin_paradas" && fase.masCercana && (
        <ParadaMasLejos parada={fase.masCercana} alElegir={alElegir} />
      )}

      {puedeReintentar(fase) && (
        <Boton onClick={alReintentar} className="w-full">
          Intentar de nuevo
        </Boton>
      )}

      {alVolver && (
        <Boton variante="fantasma" onClick={alVolver} className="self-start">
          Volver a mi parada
        </Boton>
      )}
    </>
  );
}

/**
 * Reintentar sirve cuando falló la búsqueda o el GPS, y también con el permiso
 * negado: si el ciudadano lo activó en los ajustes, vuelve a funcionar sin
 * recargar. Un navegador sin geolocalización no cambia por insistir.
 */
function puedeReintentar(fase: FaseContratiempo): boolean {
  return (
    fase.tipo === "error" ||
    (fase.tipo === "sin_ubicacion" && fase.motivo !== "no_disponible")
  );
}

/** La ruta seguida siempre es de la parada: se tocó en su lista o en sus chips. */
function rutaDe(parada: ParadaElegida, rutaId: string) {
  return (
    parada.rutas.find((ruta) => ruta.rutaId === rutaId) ?? {
      rutaId,
      nombre: "Ruta",
      tipo: null,
      icono: null,
      color: "",
    }
  );
}
