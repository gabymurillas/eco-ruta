"use client";

import { useActionState, useState } from "react";
import { guardarContrasenaNueva, type EstadoContrasenaNueva } from "../acciones";
import { CampoIngreso } from "./CampoIngreso";
import { BotonMostrar } from "./FormularioIngreso";
import { AvisoDeError, BOTON_INGRESO, IconoIngreso, TRAZO_CANDADO } from "./IconoIngreso";

const ESTADO_INICIAL: EstadoContrasenaNueva = {};

export function FormularioContrasenaNueva() {
  const [estado, enviar, enviando] = useActionState(guardarContrasenaNueva, ESTADO_INICIAL);
  const [visible, setVisible] = useState(false);
  const tipo = visible ? "text" : "password";

  return (
    <form action={enviar} className="flex flex-col gap-[18px]">
      <CampoIngreso
        etiqueta="Contraseña nueva"
        name="contrasena"
        type={tipo}
        autoComplete="new-password"
        required
        minLength={8}
        aria-describedby="contrasena-ayuda"
        icono={<IconoIngreso trazo={TRAZO_CANDADO} />}
        accion={<BotonMostrar visible={visible} controla="contrasena" onCambio={setVisible} />}
      />
      <p id="contrasena-ayuda" className="-mt-2.5 text-[13px] text-tinta-media">
        Al menos 8 caracteres.
      </p>

      <CampoIngreso
        etiqueta="Repítela"
        name="repetida"
        type={tipo}
        autoComplete="new-password"
        required
        icono={<IconoIngreso trazo={TRAZO_CANDADO} />}
      />

      {estado.error && <AvisoDeError>{estado.error}</AvisoDeError>}

      <button type="submit" disabled={enviando} className={BOTON_INGRESO}>
        {enviando ? "Guardando…" : "Guardar y entrar"}
      </button>
    </form>
  );
}
