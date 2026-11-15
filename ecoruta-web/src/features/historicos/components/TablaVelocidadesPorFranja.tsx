import { colorDeRuta } from "@/domain/colores";
import {
  etiquetaFranja,
  franjaEnUso,
  type MedicionDeFranja,
  type VelocidadesDeRuta,
} from "@/domain/historicos";

type Props = {
  rutas: readonly VelocidadesDeRuta[];
  minimoDeViajes: number;
};

const CABECERA = "border-b border-borde px-3 py-2.5";
const CELDA = "px-3 py-2.5 whitespace-nowrap";

export function TablaVelocidadesPorFranja({ rutas, minimoDeViajes }: Props) {
  return (
    <div className="flex flex-col gap-4 pb-4">
      <NotaVelocidades minimoDeViajes={minimoDeViajes} />
      {rutas.length === 0 ? (
        <p className="px-4 text-sm text-tinta-media">
          Aún no hay viajes terminados suficientes para calcular la velocidad típica. Se calcula cada noche
          con los viajes del día.
        </p>
      ) : (
        rutas.map((ruta) => <TablaDeRuta key={ruta.rutaId} ruta={ruta} minimoDeViajes={minimoDeViajes} />)
      )}
    </div>
  );
}

function TablaDeRuta({ ruta, minimoDeViajes }: { ruta: VelocidadesDeRuta; minimoDeViajes: number }) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="flex items-center gap-1.5 px-4 text-sm font-bold">
        <i aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: colorDeRuta(ruta.color) }} />
        {ruta.nombre}
      </h3>
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">Mediana de velocidad de {ruta.nombre} por hora, en día hábil y en fin de semana</caption>
        <thead className="bg-fondo">
          <tr className="text-[12.5px] font-bold text-tinta-media">
            <th scope="col" className={`${CABECERA} text-left`}>Hora</th>
            <th scope="col" className={`${CABECERA} text-right`}>Día hábil</th>
            <th scope="col" className={`${CABECERA} text-right`}>Fin de semana</th>
          </tr>
        </thead>
        <tbody>
          {ruta.franjas.map((franja) => (
            <tr key={franja.hora} className="border-b border-borde-suave">
              <th scope="row" className={`${CELDA} text-left font-semibold tabular-nums`}>{etiquetaFranja(franja.hora)}</th>
              <td className={`${CELDA} text-right`}>
                <Medicion medicion={franja.habil} minimoDeViajes={minimoDeViajes} />
              </td>
              <td className={`${CELDA} text-right`}>
                <Medicion medicion={franja.finDeSemana} minimoDeViajes={minimoDeViajes} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Sin viajes en esa franja no hay mediana: la celda queda vacía, no en cero. */
function Medicion({ medicion, minimoDeViajes }: { medicion: MedicionDeFranja | null; minimoDeViajes: number }) {
  if (medicion === null) {
    return <span className="text-tinta-suave">—</span>;
  }

  const enUso = franjaEnUso(medicion.viajes, minimoDeViajes);
  const viajes = `${medicion.viajes} ${medicion.viajes === 1 ? "viaje" : "viajes"}`;

  return (
    <span className={`tabular-nums ${enUso ? "" : "text-tinta-suave"}`}>
      {Math.round(medicion.medianaKmh)} km/h
      <span className="block text-xs text-tinta-media">
        {enUso ? viajes : `${medicion.viajes} de ${minimoDeViajes} viajes · aún no se usa`}
      </span>
    </span>
  );
}

function NotaVelocidades({ minimoDeViajes }: { minimoDeViajes: number }) {
  return (
    <p className="mx-4 rounded-[10px] border border-borde bg-fondo p-3 text-[12.5px] leading-relaxed text-tinta-media">
      Es la velocidad real de los viajes, con las paradas y los semáforos incluidos, según la hora en que
      empezaron. El tiempo estimado del ciudadano la usa en una franja cuando tiene al menos{" "}
      <strong className="font-bold text-tinta">{minimoDeViajes} viajes</strong>; con menos, usa solo la
      velocidad en vivo. Se actualiza cada noche con todo el historial, sin importar el período elegido.
    </p>
  );
}
