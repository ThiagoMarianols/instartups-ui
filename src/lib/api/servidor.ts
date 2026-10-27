// Utilitários do BFF (só servidor): URLs das APIs, cookies de sessão e refresh single-flight.
import { NextResponse } from "next/server";
import type { Tokens } from "./tipos";

export const COOKIE_ACCESS = "ia_at";
export const COOKIE_REFRESH = "ia_rt";
export const COOKIE_PERFIL = "ia_perfil";

const REFRESH_MAX_AGE = 30 * 24 * 60 * 60; // 30 dias (RefreshToken:ExpirationDays)

export const URL_APIS = {
  auth: process.env.AUTH_API_URL ?? "http://localhost:8080",
  command: process.env.COMMAND_API_URL ?? "http://localhost:8081",
  query: process.env.QUERY_API_URL ?? "http://localhost:8082",
};

export const BASE_ROTAS = {
  auth: "/api",
  command: "/api/instartups/command",
  query: "/api/instartups/query",
} as const;

const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

/** Lê o payload de um JWT sem validar a assinatura (validação é das APIs). */
export function lerPayloadJwt(token: string): Record<string, unknown> | null {
  try {
    const parte = token.split(".")[1];
    if (!parte) return null;
    const json = Buffer.from(parte.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Segundos até o token expirar (negativo se já expirou). */
export function segundosParaExpirar(token: string): number {
  const exp = Number(lerPayloadJwt(token)?.exp);
  if (!Number.isFinite(exp)) return -1;
  return exp - Math.floor(Date.now() / 1000);
}

export function subDoToken(token: string | undefined): string | null {
  if (!token) return null;
  const sub = lerPayloadJwt(token)?.sub;
  return typeof sub === "string" && sub ? sub : null;
}

export function gravarTokens(resposta: NextResponse, tokens: Tokens) {
  const maxAgeAccess = Math.max(60, Math.min(segundosParaExpirar(tokens.accessToken), REFRESH_MAX_AGE));
  resposta.cookies.set(COOKIE_ACCESS, tokens.accessToken, { ...cookieBase, maxAge: maxAgeAccess });
  resposta.cookies.set(COOKIE_REFRESH, tokens.refreshToken, { ...cookieBase, maxAge: REFRESH_MAX_AGE });
}

export function gravarTemPerfil(resposta: NextResponse, temPerfil: boolean) {
  resposta.cookies.set(COOKIE_PERFIL, temPerfil ? "1" : "0", { ...cookieBase, maxAge: REFRESH_MAX_AGE });
}

export function limparSessao(resposta: NextResponse) {
  for (const nome of [COOKIE_ACCESS, COOKIE_REFRESH, COOKIE_PERFIL]) {
    resposta.cookies.set(nome, "", { ...cookieBase, maxAge: 0 });
  }
}

/** Chamada servidor → API. */
export async function chamarApi(
  servico: keyof typeof URL_APIS,
  caminho: string,
  init: { method?: string; body?: BodyInit | null; token?: string; json?: unknown; contentType?: string | null } = {},
): Promise<Response> {
  const headers: Record<string, string> = { Accept: "application/json" };
  let body: BodyInit | null | undefined = init.body;
  if (init.json !== undefined) {
    body = JSON.stringify(init.json);
    headers["Content-Type"] = "application/json";
  } else if (body && init.contentType) {
    headers["Content-Type"] = init.contentType;
  }
  if (init.token) headers.Authorization = `Bearer ${init.token}`;

  return fetch(`${URL_APIS[servico]}${BASE_ROTAS[servico]}/${caminho.replace(/^\/+/, "")}`, {
    method: init.method ?? "GET",
    headers,
    body: body ?? undefined,
    cache: "no-store",
  });
}

export async function lerJson(resposta: Response): Promise<unknown> {
  const texto = await resposta.text();
  if (!texto) return null;
  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}

// ---------- Refresh single-flight ----------
// A API rotaciona o refresh token e revoga o antigo: duas renovações simultâneas com o
// mesmo token fariam uma delas falhar. Guardamos a promessa em andamento e o resultado
// recente por alguns segundos, para requisições paralelas que ainda carregam o cookie antigo.
const emAndamento = new Map<string, Promise<Tokens | null>>();
const recentes = new Map<string, { tokens: Tokens; ate: number }>();
const JANELA_RECENTE_MS = 30_000;

async function executarRefresh(refreshToken: string): Promise<Tokens | null> {
  try {
    const resposta = await chamarApi("auth", "auth/refresh", { method: "POST", json: { refreshToken } });
    if (!resposta.ok) return null;
    const json = (await lerJson(resposta)) as { data?: Tokens } | null;
    const tokens = json?.data;
    if (!tokens?.accessToken || !tokens.refreshToken) return null;
    return tokens;
  } catch {
    return null;
  }
}

export function renovarTokens(refreshToken: string): Promise<Tokens | null> {
  const agora = Date.now();
  for (const [chave, valor] of recentes) if (valor.ate < agora) recentes.delete(chave);

  const recente = recentes.get(refreshToken);
  if (recente) return Promise.resolve(recente.tokens);

  const atual = emAndamento.get(refreshToken);
  if (atual) return atual;

  const promessa = executarRefresh(refreshToken)
    .then((tokens) => {
      if (tokens) recentes.set(refreshToken, { tokens, ate: Date.now() + JANELA_RECENTE_MS });
      return tokens;
    })
    .finally(() => emAndamento.delete(refreshToken));
  emAndamento.set(refreshToken, promessa);
  return promessa;
}

/** Testes: limpa o estado do single-flight. */
export function __limparRefreshParaTestes() {
  emAndamento.clear();
  recentes.clear();
}

/** Access token válido para uso no servidor, renovando se preciso. */
export async function obterTokenValido(
  accessToken: string | undefined,
  refreshToken: string | undefined,
): Promise<{ token: string; novos: Tokens | null } | null> {
  if (accessToken && segundosParaExpirar(accessToken) >= 30) return { token: accessToken, novos: null };
  if (!refreshToken) return null;
  const novos = await renovarTokens(refreshToken);
  return novos ? { token: novos.accessToken, novos } : null;
}

/** Descobre se o usuário já tem perfil (Q1). Só 404 significa "sem perfil". */
export async function consultarTemPerfil(token: string): Promise<boolean> {
  try {
    const resposta = await chamarApi("query", "perfil/me", { token });
    return resposta.status !== 404;
  } catch {
    return true;
  }
}

/** Repassa uma resposta de erro da API ao navegador, preservando status e corpo. */
export async function repassarErro(resposta: Response) {
  const corpo = await lerJson(resposta);
  return NextResponse.json(corpo ?? { isSuccess: false, message: null, data: null }, { status: resposta.status });
}
