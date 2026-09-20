/**
 * Regenera src/types/database.generated.ts desde el esquema de Supabase.
 *
 * Antes esto era un redirect: `supabase gen types ... > database.generated.ts`.
 * Dos cosas lo hacían peligroso. El `>` vacía el archivo destino antes de que el
 * comando corra, y la CLI termina con código 0 aunque falle: sin
 * SUPABASE_ACCESS_TOKEN imprime un JSON de error por stdout y npm lo da por
 * exitoso. Resultado: los tipos quedaban en blanco y el proyecto dejaba de
 * compilar sin ninguna señal de qué pasó.
 *
 * Aquí la salida se valida antes de escribir. Si no trae tipos, el archivo
 * anterior se queda intacto.
 */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const PROYECTO = "yumfwnqvmcitjnskazgx";
const DESTINO = new URL("../src/types/database.generated.ts", import.meta.url);
const MARCA = "export type Database";

let salida;

try {
  salida = execFileSync(
    "npx",
    ["-y", "supabase@latest", "gen", "types", "typescript", "--project-id", PROYECTO],
    { encoding: "utf8", shell: true, maxBuffer: 32 * 1024 * 1024 },
  );
} catch (causa) {
  terminar(causa.stdout || causa.stderr || String(causa));
}

if (!salida.includes(MARCA)) {
  terminar(salida);
}

writeFileSync(DESTINO, salida);
console.log("Tipos regenerados desde el esquema.");

function terminar(detalle) {
  console.error(
    [
      "La CLI de Supabase no devolvió tipos. El archivo anterior queda intacto.",
      "Lo más común es que falte SUPABASE_ACCESS_TOKEN en el entorno.",
      "",
      String(detalle).trim().slice(0, 600),
    ].join("\n"),
  );
  process.exit(1);
}
