import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

/** Única familia de la web del ciudadano (decisión de la autora, 2026-11-11). */
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

/**
 * Base de las direcciones absolutas de la vista previa al compartir (Open Graph).
 * Sin ella Next las arma con localhost y WhatsApp no encuentra la foto. Vercel
 * define VERCEL_PROJECT_PRODUCTION_URL al compilar; en local no existe.
 */
const DOMINIO_DE_PRODUCCION = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const metadata: Metadata = {
  metadataBase: new URL(
    DOMINIO_DE_PRODUCCION ? `https://${DOMINIO_DE_PRODUCCION}` : "http://localhost:3000",
  ),
  title: "EcoRuta San Juan",
  description:
    "Seguimiento en tiempo real de rutas de transporte y recolección en San Juan de los Morros.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${montserrat.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
