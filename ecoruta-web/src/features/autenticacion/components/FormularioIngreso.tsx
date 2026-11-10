"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ingresar, type EstadoIngreso } from "../acciones";
import { CampoIngreso } from "./CampoIngreso";
import {
  AvisoDeError,
  BOTON_INGRESO,
  ENLACE_INGRESO,
  IconoIngreso,
  TRAZO_CANDADO,
  TRAZO_CORREO,
} from "./IconoIngreso";

const ESTADO_INICIAL: EstadoIngreso = {};

export function FormularioIngreso() {
  const [estado, enviar, enviando] = useActionState(ingresar, ESTADO_INICIAL);
  const [verContrasena, setVerContrasena] = useState(false);

  return (
    <form action={enviar} className="flex flex-col gap-[18px]">
      <CampoIngreso
        etiqueta="Correo"
        name="correo"
        type="email"
        autoComplete="email"
        required
        defaultValue={estado.correo}
        placeholder="gestor@ecoruta.ve"
        icono={<IconoIngreso trazo={TRAZO_CORREO} />}
      />

      <CampoIngreso
        etiqueta="Contraseña"
        name="contrasena"
        type={verContrasena ? "text" : "password"}
        autoComplete="current-password"
        required
        icono={<IconoIngreso trazo={TRAZO_CANDADO} />}
        accion={<BotonMostrar visible={verContrasena} controla="contrasena" onCambio={setVerContrasena} />}
      />

      <div className="-mt-1 flex items-center justify-between gap-3 text-sm">
        {/* Desmarcado, la sesión termina al cerrar el navegador: para una
            computadora compartida en la alcaldía. */}
        <label className="flex cursor-pointer items-center gap-2 text-tinta-media">
          <input type="checkbox" name="mantener" defaultChecked className="size-[18px] accent-marca-profundo" />
          Mantener la sesión
        </label>
        <Link href="/admin/recuperar" className={ENLACE_INGRESO}>
          ¿Olvidaste la contraseña?
        </Link>
      </div>

      {estado.error && <AvisoDeError>{estado.error}</AvisoDeError>}

      <button type="submit" disabled={enviando} className={BOTON_INGRESO}>
        {enviando ? "Entrando…" : "Entrar al panel"}
        {!enviando && <IconoIngreso trazo={<path d="M5 12h14M13 6l6 6-6 6" />} grosor={2.4} />}
      </button>
    </form>
  );
}

export function BotonMostrar({
  visible,
  controla,
  onCambio,
}: {
  visible: boolean;
  controla: string;
  onCambio: (visible: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onCambio(!visible)}
      aria-pressed={visible}
      aria-controls={controla}
      className="rounded-md px-1.5 py-1 text-[13px] font-bold text-marca focus-visible:outline-2 focus-visible:outline-marca-profundo"
    >
      {visible ? "Ocultar" : "Mostrar"}
    </button>
  );
}
