import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gastos",
    short_name: "Gastos",
    description: "Registrá gastos, ingresos y ahorros en pareja.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "es",
    background_color: "#030711",
    theme_color: "#030711",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
