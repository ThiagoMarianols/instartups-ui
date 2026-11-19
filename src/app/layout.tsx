import type { Metadata, Viewport } from "next";
import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dropzone/styles.css";
import "leaflet/dist/leaflet.css";
import "@/theme/global.css";
import { SCRIPT_CAPTURA_INSTALACAO } from "@/lib/pwa/instalacao";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "InStartups",
  description: "Startups e investidores no mesmo feed.",
  applicationName: "InStartups",
  appleWebApp: { capable: true, title: "InStartups", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

// Cor da barra do navegador/app instalado = --app-page de cada esquema (global.css).
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f9fa" },
    { media: "(prefers-color-scheme: dark)", color: "#1f1f1f" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_CAPTURA_INSTALACAO }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
