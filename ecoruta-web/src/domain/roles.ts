/**
 * Roles del panel (ADR-0015).
 *
 * - `admin`: configura la red de servicio y gestiona el equipo.
 * - `operador`: monitorea y atiende incidencias; todo lo demás, solo lectura.
 *
 * Esto decide qué muestra la interfaz. Quien de verdad autoriza es RLS en la
 * base (sql/17_roles_del_panel.sql): esconder un botón no protege nada.
 */
export const ROLES_DEL_PANEL = ["admin", "operador"] as const;

export type RolDelPanel = (typeof ROLES_DEL_PANEL)[number];

/**
 * Un valor desconocido no es ningún rol. Las cuentas de los teléfonos
 * (`dispositivo`) y las que no tienen rol no entran al panel.
 */
export function leerRolDelPanel(valor: unknown): RolDelPanel | null {
  return ROLES_DEL_PANEL.find((rol) => rol === valor) ?? null;
}

export const NOMBRE_DE_ROL: Record<RolDelPanel, string> = {
  admin: "Administrador",
  operador: "Operador",
};

/** Lo que cada rol puede hacer, en una línea: se muestra al invitar y al cambiar el rol. */
export const ALCANCE_DE_ROL: Record<RolDelPanel, string> = {
  admin: "Configura rutas, paradas, unidades y parámetros, y gestiona el equipo.",
  operador: "Monitorea y atiende incidencias. No puede cambiar la configuración.",
};

/** Crear, editar y borrar la configuración, y gestionar el equipo. */
export function puedeAdministrar(rol: RolDelPanel): boolean {
  return rol === "admin";
}
