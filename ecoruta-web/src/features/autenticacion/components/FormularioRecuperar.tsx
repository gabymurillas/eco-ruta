"use client";

import Link from "next/link";
import { useActionState } from "react";
import { pedirEnlace, type EstadoRecuperacion } from "../acciones";
import { CampoIngreso } from "./CampoIngreso";
import { AvisoDeError, BOTON_INGRESO, ENLACE_INGRESO, IconoIngreso, TRAZO_CORREO } from "./IconoIngreso";

const ESTADO_INICIAL: EstadoRecuperacion = {};

export function FormularioRecuperar({ enlaceFallido }: { enlaceFallido: boolean }) {
  const [estado, enviar, enviando] = useActionState(pedirEnlace, ESTADO_INICIAL);

  if (estado.enviadoA) {
    return <EnlaceEnviado correo={estado.enviadoA} />;
  }

  return (
    <form action={enviar} className="flex flex-col gap-[18px]">
      {enlaceFallido && !estado.error && (
        <AvisoDeError>El enlace venció o ya se usó. Pide uno nuevo.</AvisoDeError>
      )}

      <CampoIngreso
        etiqueta="Correo de tu cuenta"
        name="correo"
        type="email"
        autoComplete="email"
        required
        placeholder="gestor@ecoruta.ve"
        icono={<IconoIngreso trazo={TRAZO_CORREO} />}
      />

      {estado.error && <AvisoDeError>{estado.error}</AvisoDeError>}

      <button type="submit" disabled={enviando} className={BOTON_INGRESO}>
        {enviando ? "Enviando…" : "Enviarme el enlace"}
      </button>

      <Link href="/admin/ingreso" className={`${ENLACE_INGRESO} self-center text-sm`}>
        Volver al ingreso
      </Link>
    </form>
  );
}

/** No confirma que la cuenta exista: dice lo que pasa si existe. */
function EnlaceEnviado({ correo }: { correo: string }) {
  return (
    <div role="status" className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-xl border border-borde bg-fondo px-4 py-3.5 text-[14.5px] leading-relaxed">
        <p className="font-bold">Revisa tu correo</p>
        <p className="text-tinta-media">
          Si <strong className="font-semibold text-tinta">{correo}</strong> tiene una cuenta del
          panel, te llegó un enlace para elegir otra contraseña. Ábrelo en este mismo navegador.
        </p>
        <p className="text-tinta-media">
          Si no aparece en unos minutos, mira en «Correo no deseado».
        </p>
      </div>
      <Link href="/admin/ingreso" className={`${ENLACE_INGRESO} self-center text-sm`}>
        Volver al ingreso
      </Link>
    </div>
  );
}
