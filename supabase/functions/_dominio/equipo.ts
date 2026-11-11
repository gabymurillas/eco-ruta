/**
 * Reglas del equipo del panel: quién es miembro y qué cambios se aceptan.
 *
 * Funciones puras, sin Supabase ni red: la Edge Function `gestionar-equipo` trae
 * las cuentas y ejecuta el cambio; aquí solo se decide. Así las reglas que
 * importan —nadie se toca a sí mismo, nunca cero administradores— se pueden
 * leer y probar sin desplegar nada.
 */

export const ROLES_DEL_PANEL = ["admin", "operador"] as const;

export type RolDelPanel = (typeof ROLES_DEL_PANEL)[number];

/** Lo que se usa de una cuenta de Supabase Auth. */
export type CuentaDeAuth = {
  id: string;
  email?: string | null;
  app_metadata?: Record<string, unknown> | null;
  invited_at?: string | null;
  email_confirmed_at?: string | null;
  last_sign_in_at?: string | null;
};

export type Miembro = {
  id: string;
  correo: string;
  rol: RolDelPanel;
  ultimoIngresoAt: string | null;
  invitadoAt: string | null;
  /** Se le mandó la invitación y todavía no abrió el enlace. */
  invitacionPendiente: boolean;
};

export type Cambio = { tipo: "cambiar_rol"; rol: RolDelPanel } | { tipo: "quitar" };

/** Un valor desconocido no es ningún rol: nunca se cae a uno por defecto. */
export function leerRolDelPanel(valor: unknown): RolDelPanel | null {
  return ROLES_DEL_PANEL.find((rol) => rol === valor) ?? null;
}

/**
 * Solo las cuentas con rol del panel. Las de los teléfonos (`rol = 'dispositivo'`)
 * y las que no tienen rol quedan fuera: no se listan ni se pueden modificar desde
 * Equipo. El rol se lee de `app_metadata`, nunca de `user_metadata`.
 */
export function aMiembros(cuentas: readonly CuentaDeAuth[]): Miembro[] {
  return cuentas
    .flatMap((cuenta) => {
      const rol = leerRolDelPanel(cuenta.app_metadata?.rol);
      return rol ? [aMiembro(cuenta, rol)] : [];
    })
    .sort((a, b) => a.correo.localeCompare(b.correo, "es"));
}

function aMiembro(cuenta: CuentaDeAuth, rol: RolDelPanel): Miembro {
  return {
    id: cuenta.id,
    correo: cuenta.email ?? "",
    rol,
    ultimoIngresoAt: cuenta.last_sign_in_at ?? null,
    invitadoAt: cuenta.invited_at ?? null,
    invitacionPendiente: Boolean(cuenta.invited_at) && !cuenta.email_confirmed_at,
  };
}

export function normalizarCorreo(valor: unknown): string {
  return String(valor ?? "").trim().toLowerCase();
}

/** Forma mínima: quien valida de verdad es el correo que llega o no llega. */
export function esCorreoValido(correo: string): boolean {
  return correo.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

/**
 * Devuelve el motivo por el que el cambio no se acepta, o null si procede.
 *
 * `miembros` es la lista completa y recién leída: la regla de «nunca cero
 * administradores» cuenta sobre ella. Un admin con la invitación pendiente no
 * cuenta: todavía no puede entrar, y dejarlo como único admin dejaría el panel
 * sin nadie que lo gestione.
 */
export function validarCambio(
  { actorId, objetivoId, miembros, cambio }: {
    actorId: string;
    objetivoId: string;
    miembros: readonly Miembro[];
    cambio: Cambio;
  },
): string | null {
  const objetivo = miembros.find((miembro) => miembro.id === objetivoId);

  if (!objetivo) {
    return "Esa cuenta ya no forma parte del equipo. Recarga la página.";
  }

  if (objetivoId === actorId) {
    return cambio.tipo === "quitar"
      ? "No puedes quitarte el acceso a ti mismo. Pídeselo a otro administrador."
      : "No puedes cambiar tu propio rol. Pídeselo a otro administrador.";
  }

  const dejaDeSerAdmin =
    objetivo.rol === "admin" && (cambio.tipo === "quitar" || cambio.rol !== "admin");

  if (dejaDeSerAdmin && !quedaOtroAdmin(miembros, objetivoId)) {
    return "Tiene que quedar al menos un administrador con acceso.";
  }

  return null;
}

function quedaOtroAdmin(miembros: readonly Miembro[], objetivoId: string): boolean {
  return miembros.some(
    (miembro) =>
      miembro.id !== objetivoId && miembro.rol === "admin" && !miembro.invitacionPendiente,
  );
}
