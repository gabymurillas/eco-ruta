"use client";

import { useActionState, useState } from "react";
import { ingresar, type EstadoIngreso } from "../acciones";
import { CampoIngreso } from "./CampoIngreso";

const ESTADO_INICIAL: EstadoIngreso = {};

export function FormularioIngreso() {
  const [estado, enviar, enviando] = useActionState(ingresar, ESTADO_INICIAL);
  const [verContrasena, setVerContrasena] = useState(false);
  const [ayudaContrasena, setAyudaContrasena] = useState(false);

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
        icono={<Icono trazo={<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>} />}
      />

      <CampoIngreso
        etiqueta="Contraseña"
        name="contrasena"
        type={verContrasena ? "text" : "password"}
        autoComplete="current-password"
        required
        icono={<Icono trazo={<><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>} />}
        accion={
          <button
            type="button"
            onClick={() => setVerContrasena((visible) => !visible)}
            aria-pressed={verContrasena}
            aria-controls="contrasena"
            className="rounded-md px-1.5 py-1 text-[13px] font-bold text-marca focus-visible:outline-2 focus-visible:outline-marca-profundo"
          >
            {verContrasena ? "Ocultar" : "Mostrar"}
          </button>
        }
      />

      <div className="-mt-1 flex items-center justify-between gap-3 text-sm">
        {/* Visual por ahora: la sesión ya se mantiene abierta. Que desmarcarlo la
            cierre al salir del navegador queda pendiente de implementar. */}
        <label className="flex cursor-pointer items-center gap-2 text-tinta-media">
          <input
            type="checkbox"
            name="mantener"
            defaultChecked
            className="size-[18px] accent-marca-profundo"
          />
          Mantener la sesión
        </label>
        <button
          type="button"
          onClick={() => setAyudaContrasena((visible) => !visible)}
          aria-expanded={ayudaContrasena}
          aria-controls="ayuda-contrasena"
          className="rounded-md font-bold text-marca focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo"
        >
          ¿Olvidaste la contraseña?
        </button>
      </div>

      {ayudaContrasena && (
        <p id="ayuda-contrasena" className="rounded-xl border border-borde bg-fondo px-4 py-3 text-[13.5px] leading-relaxed">
          Por ahora no se puede recuperar desde aquí. Pídele a la persona que administra
          EcoRuta en la alcaldía que restablezca tu contraseña.
        </p>
      )}

      {estado.error && (
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-borde bg-superficie px-4 py-3 text-sm font-semibold"
        >
          <Icono
            className="mt-px text-error"
            trazo={<><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5M12 16v.1" /></>}
          />
          {estado.error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="mt-1 flex h-[54px] w-full items-center justify-center gap-2.5 rounded-xl bg-marca-profundo text-base font-bold text-superficie transition-[filter] duration-200 ease-out hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-profundo disabled:opacity-60"
      >
        {enviando ? "Entrando…" : "Entrar al panel"}
        {!enviando && <Icono trazo={<path d="M5 12h14M13 6l6 6-6 6" />} grosor={2.4} />}
      </button>
    </form>
  );
}

function Icono({
  trazo,
  grosor = 1.8,
  className = "",
}: {
  trazo: React.ReactNode;
  grosor?: number;
  className?: string;
}) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      {trazo}
    </svg>
  );
}
