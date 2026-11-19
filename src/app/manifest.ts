import type { MetadataRoute } from "next";

// Servido em /manifest.webmanifest (liberado no matcher do proxy).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "InStartups",
    short_name: "InStartups",
    description: "Startups e investidores no mesmo feed.",
    lang: "pt-BR",
    start_url: "/feed",
    scope: "/",
    display: "standalone",
    background_color: "#141414",
    theme_color: "#141414",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Feed", url: "/feed", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Buscar", url: "/busca", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
