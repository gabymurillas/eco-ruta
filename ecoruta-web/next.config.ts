import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // AVIF pesa menos que WebP en fotos; el navegador que no lo acepta recibe WebP.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
