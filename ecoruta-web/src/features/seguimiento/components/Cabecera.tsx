type Props = {
  enVivo: boolean;
};

/**
 * Franja delgada sobre el mapa: la marca a la izquierda y, a la derecha, si hay
 * alguna unidad transmitiendo hacia la parada. «En vivo» es un estado, no
 * identidad: por regla del sistema usa verde, nunca terracota.
 */
export function Cabecera({ enVivo }: Props) {
  return (
    <header className="z-[1100] box-content flex h-14 shrink-0 items-center justify-between gap-3 border-b border-borde bg-superficie px-5 pt-[env(safe-area-inset-top)]">
      <span className="flex items-baseline gap-2">
        <span aria-hidden="true" className="size-2 self-center rounded-full bg-marca" />
        <span className="text-[18px] font-extrabold tracking-tight">EcoRuta</span>
        <span className="hidden text-xs font-semibold text-tinta-suave sm:inline">
          San Juan de los Morros
        </span>
      </span>

      {enVivo && (
        <span className="flex h-8 items-center gap-2 rounded-full border border-borde px-3">
          <span aria-hidden="true" className="pulso-en-vivo size-[7px] rounded-full bg-exito" />
          <span className="text-[13px] font-bold">En vivo</span>
        </span>
      )}
    </header>
  );
}
