import { defineConfig, devices } from "@playwright/test";

/**
 * E2E contra o app rodando em http://localhost:3000 com as 3 APIs e o seed carregados.
 * Usuário de teste: E2E_USUARIO / E2E_SENHA (padrão: paymangue / Senha@123 do seed).
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_URL ?? "http://localhost:3000",
    locale: "pt-BR",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
});
