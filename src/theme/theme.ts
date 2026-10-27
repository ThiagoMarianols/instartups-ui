import { createTheme, type MantineColorsTuple } from "@mantine/core";

/**
 * Tema do canvas "InStartups — Telas" (Guia · Tema Mantine).
 * Um único tom primário: dark.9 (#141414) no claro e dark.0 (#c9c9c9) no escuro.
 */
const dark: MantineColorsTuple = [
  "#c9c9c9",
  "#b8b8b8",
  "#828282",
  "#696969",
  "#424242",
  "#3b3b3b",
  "#2e2e2e",
  "#242424",
  "#1f1f1f",
  "#141414",
];

export const theme = createTheme({
  primaryColor: "dark",
  primaryShade: { light: 9, dark: 0 },
  autoContrast: true,
  defaultRadius: "md",
  cursorType: "pointer",
  colors: { dark },
  // Mantine 9 mudou medium para 600; o canvas usa 500 em labels.
  fontWeights: { regular: "400", medium: "500", bold: "700" },
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'",
  headings: {
    fontWeight: "700",
  },
  components: {
    Badge: {
      defaultProps: { radius: "xl" },
      styles: { root: { letterSpacing: "0.04em", fontWeight: 700 } },
    },
    Button: {
      styles: { root: { fontWeight: 600 } },
    },
    Paper: {
      defaultProps: { radius: "md" },
    },
    Card: {
      defaultProps: { radius: "md", withBorder: true, padding: "md" },
    },
    Modal: {
      defaultProps: {
        radius: "lg",
        overlayProps: { backgroundOpacity: 0.6 },
      },
      styles: { title: { fontSize: 20, fontWeight: 700 } },
    },
    InputWrapper: {
      styles: { label: { fontWeight: 500, marginBottom: 4 } },
    },
    Tooltip: {
      defaultProps: { withArrow: false },
    },
  },
});
