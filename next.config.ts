import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Gera .next/standalone/server.js para a imagem Docker (infra/Dockerfile)
  output: "standalone",
  // O service worker nunca pode ficar preso em cache, senão as atualizações não chegam.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
  experimental: {
    optimizePackageImports: [
      "@mantine/core",
      "@mantine/hooks",
      "@mantine/dates",
      "@tabler/icons-react",
    ],
  },
};

export default nextConfig;
