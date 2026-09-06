"use client";

import { useActionState } from "react";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { ingresar, type EstadoIngreso } from "../acciones";

const ESTADO_INICIAL: EstadoIngreso = {};

export function FormularioIngreso() {
  const [estado, enviar, enviando] = useActionState(ingresar, ESTADO_INICIAL);

  return (
    <form action={enviar} className="flex flex-col gap-[18px]">
      <Campo
        etiqueta="Correo"
        name="correo"
        type="email"
        autoComplete="email"
        required
        placeholder="admin@ecoruta.ve"
      />

      <Campo
        etiqueta="Contraseña"
        name="contrasena"
        type="password"
        autoComplete="current-password"
        required
        placeholder="••••••••"
      />

      {estado.error && (
        <p role="alert" className="text-[13px] font-semibold text-error">
          {estado.error}
        </p>
      )}

      <Boton type="submit" disabled={enviando} className="h-[52px] w-full text-base">
        {enviando ? "Entrando…" : "Entrar"}
      </Boton>
    </form>
  );
}
