import { expect, test, type Page } from "@playwright/test";

// Os testes não deixam dados novos: curtidas e seguidores são desfeitos no próprio teste.
// Cada login abre uma sessão (máx. 3 por usuário): o afterEach sempre faz logout.
const USUARIO = process.env.E2E_USUARIO ?? "paymangue";
const SENHA = process.env.E2E_SENHA ?? "Senha@123";

async function entrar(page: Page) {
  await page.goto("/login");
  await page.locator("input[autocomplete=username]").fill(USUARIO);
  await page.locator("input[type=password]").fill(SENHA);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/feed");
}

test.afterEach(async ({ page }) => {
  await page.request.post("/api/sessao/logout");
});

test.describe("sem sessão", () => {
  test("rotas internas redirecionam para o login", async ({ page }) => {
    await page.goto("/feed");
    await expect(page).toHaveURL(/\/login\?voltar=%2Ffeed/);
  });

  test("login valida campos e mostra credenciais inválidas", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText("O campo é obrigatório.")).toHaveCount(2);
    await page.locator("input[autocomplete=username]").fill(USUARIO);
    await page.locator("input[type=password]").fill("senha-errada");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText("Credenciais inválidas.")).toBeVisible();
  });

  test("cadastro aplica as regras da API auth", async ({ page }) => {
    await page.goto("/cadastro");
    const usuario = page.locator("input[autocomplete=username]");
    await usuario.fill("com espaço");
    await expect(usuario).toHaveValue("comespao");
    await usuario.fill("");
    await page.locator("input[type=email]").fill("sem-arroba");
    await page.locator("input[type=password]").fill("Agro2026x");
    const tel = page.locator("input[type=tel]");
    await tel.fill("16 9999");
    await expect(tel).toHaveValue("(16) 9999");
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page.getByText("O campo é obrigatório.")).toBeVisible();
    await expect(page.getByText("Formato inválido.")).toHaveCount(2);
    await expect(page.getByText(/caractere especial\.$/)).toBeVisible();
  });
});

test.describe("com sessão", () => {
  test.beforeEach(async ({ page }) => entrar(page));

  test("feed carrega postagens e filtros vão para a URL", async ({ page }) => {
    await expect(page.locator("article").first()).toBeVisible();
    await page.getByRole("tab", { name: "Startups" }).click();
    await expect(page).toHaveURL(/tipo=startup/);
    await page.getByRole("button", { name: /^Filtros/ }).click();
    await page.getByText("Qualquer distância").click();
    await page.getByRole("button", { name: "Aplicar filtros" }).click();
    await expect(page).toHaveURL(/raio=100/);
    await page.getByRole("button", { name: "Remover filtro de distância" }).click();
    await expect(page).not.toHaveURL(/raio=/);
  });

  test("compositor exige descrição", async ({ page }) => {
    const publicar = page.getByRole("button", { name: "Publicar" });
    await expect(publicar).toBeDisabled();
    await page.getByLabel("Descrição da postagem").fill("   ");
    await expect(publicar).toBeDisabled();
  });

  test("curtir e descurtir (contador otimista)", async ({ page }) => {
    const card = page.locator("article").filter({ has: page.getByRole("button", { name: /^(Curtir|Descurtir)$/ }) }).first();
    const botao = card.getByRole("button", { name: /^(Curtir|Descurtir)$/ });
    const textoCurtidas = (n: number) => `${n.toLocaleString("pt-BR")} ${n === 1 ? "curtida" : "curtidas"}`;
    const antes = Number.parseInt((await botao.innerText()).replace(/\D/g, ""), 10);
    const curtia = (await botao.getAttribute("aria-pressed")) === "true";
    const depois = antes + (curtia ? -1 : 1);
    await botao.click();
    await expect(botao).toHaveText(textoCurtidas(depois));
    await expect(botao).toBeEnabled();
    await botao.click(); // desfaz
    await expect(botao).toHaveText(textoCurtidas(antes));
  });

  test("busca remove o @ e segue/deixa de seguir pelo resultado", async ({ page }) => {
    await page.goto("/busca");
    await page.getByLabel("Buscar perfis").fill("@capital");
    await expect(page.getByText(/encontrados?$/)).toBeVisible();
    const item = page.locator("article").first();
    const botao = item.getByRole("button", { name: /^(Seguir|Seguindo)$/ });
    if ((await botao.innerText()) === "Seguindo") {
      await botao.click();
      await page.getByRole("button", { name: "Deixar de seguir" }).click();
      await expect(botao).toHaveText("Seguir");
      await botao.click(); // restaura
      await expect(botao).toHaveText("Seguindo");
    } else {
      await botao.click();
      await expect(botao).toHaveText("Seguindo");
      await botao.click();
      await page.getByRole("button", { name: "Deixar de seguir" }).click(); // restaura
      await expect(botao).toHaveText("Seguir");
    }
  });

  test("meu perfil abre o modal de edição pré-preenchido", async ({ page }) => {
    await page.goto("/perfil/me");
    await page.getByRole("button", { name: "Editar perfil" }).click();
    const nome = page.locator("[data-path='perfil.nome']");
    await expect(nome).not.toHaveValue("");
    await nome.fill("");
    await page.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(page.getByText("O campo é obrigatório.")).toBeVisible();
  });

  test("configurações: troca de tema", async ({ page }) => {
    await page.goto("/configuracoes");
    await page.getByText("Escuro", { exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-mantine-color-scheme", "dark");
    await page.getByText("Sistema", { exact: true }).click();
  });
});
