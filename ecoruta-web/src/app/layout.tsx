import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

/** Única familia de la web del ciudadano (decisión de la autora, 2026-11-11). */
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
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
