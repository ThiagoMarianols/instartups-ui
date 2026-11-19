// Cliente do navegador. Fala só com o BFF do Next (/api/bff e /api/sessao); nunca com as APIs diretamente.
import { ErroApi, normalizarErro, type ContextoErro } from "./erros";

export type Servico = "auth" | "command" | "query";

type Metodo = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface Opcoes {
  metodo?: Metodo;
  corpo?: unknown;
  params?: Record<string, string | number | boolean | string[] | null | undefined>;
  signal?: AbortSignal;
  contexto?: ContextoErro;
}

function montarQuery(params: Opcoes["params"]): string {
  if (!params) return "";
  const qs = new URLSearchParams();
  for (const [chave, valor] of Object.entries(params)) {
    if (valor === undefined || valor === null || valor === "") continue;
    if (Array.isArray(valor)) valor.forEach((v) => qs.append(chave, v));
    else qs.append(chave, String(valor));
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

let redirecionando = false;

function tratarSessaoExpirada() {
  if (typeof window === "undefined" || redirecionando) return;
  redirecionando = true;
  // Recarga completa de propósito: descarta o cache do React Query da sessão encerrada.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign("/login?expirada=1");
}

/** Faz a chamada e devolve o JSON bruto (ou null em 204). Lança ErroApi. */
export async function requisitar<T = unknown>(url: string, opcoes: Opcoes = {}): Promise<T> {
  const { metodo = "GET", corpo, params, signal, contexto = "geral" } = opcoes;
  let resposta: Response;
  try {
    resposta = await fetch(url + montarQuery(params), {
      method: metodo,
      headers: corpo !== undefined ? { "Content-Type": "application/json", Accept: "application/json" } : { Accept: "application/json" },
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
      signal,
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw normalizarErro(0, null, contexto);
  }

  if (resposta.status === 204) return null as T;

  const texto = await resposta.text();
  let json: unknown = null;
  if (texto) {
    try {
      json = JSON.parse(texto);
    } catch {
      json = null;
    }
  }

  if (!resposta.ok) {
    const erro = normalizarErro(resposta.status, json, contexto);
    if (erro.sessaoExpirada) tratarSessaoExpirada();
    throw erro;
  }
  return json as T;
}

/** Chamada a uma das APIs via BFF. Devolve `data` do envelope. */
export async function api<T>(servico: Servico, caminho: string, opcoes: Opcoes = {}): Promise<T> {
  const limpo = caminho.replace(/^\/+/, "");
  const json = await requisitar<{ data?: T } | null>(`/api/bff/${servico}/${limpo}`, opcoes);
  return (json && typeof json === "object" && "data" in json ? json.data : (json as unknown)) as T;
}

export { ErroApi };
