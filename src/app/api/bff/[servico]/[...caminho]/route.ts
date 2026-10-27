// Proxy genérico do BFF: /api/bff/{auth|command|query}/{caminho}
// Injeta o Bearer a partir do cookie httpOnly e renova a sessão quando o access token expira.
import { NextResponse, type NextRequest } from "next/server";
import {
  COOKIE_ACCESS,
  COOKIE_REFRESH,
  URL_APIS,
  chamarApi,
  gravarTokens,
  limparSessao,
  renovarTokens,
  segundosParaExpirar,
} from "@/lib/api/servidor";
import type { Tokens } from "@/lib/api/tipos";

type Servico = keyof typeof URL_APIS;

// Rotas que o navegador pode alcançar por serviço. Login/refresh/logout ficam em /api/sessao.
const PERMITIDAS: Record<Servico, (metodo: string, caminho: string) => boolean> = {
  auth: (metodo, caminho) =>
    (caminho === "user/me" && (metodo === "GET" || metodo === "PUT")) ||
    (caminho === "user/me/password" && metodo === "PUT"),
  command: (_metodo, caminho) => /^(perfil|postagem)(\/|$)/.test(caminho),
  query: (metodo) => metodo === "GET",
};

function sessaoExpirada() {
  const resposta = NextResponse.json(
    { isSuccess: false, message: "Sua sessão expirou. Entre novamente.", data: null, sessaoExpirada: true },
    { status: 401 },
  );
  limparSessao(resposta);
  return resposta;
}

async function proxy(request: NextRequest, ctx: RouteContext<"/api/bff/[servico]/[...caminho]">) {
  const { servico, caminho } = await ctx.params;
  if (!(servico in URL_APIS)) return NextResponse.json({ message: "Não encontrado." }, { status: 404 });

  const metodo = request.method.toUpperCase();
  const rota = caminho.map(encodeURIComponent).join("/");
  if (!PERMITIDAS[servico as Servico](metodo, rota)) {
    return NextResponse.json({ isSuccess: false, message: "Rota não permitida.", data: null }, { status: 404 });
  }

  let accessToken = request.cookies.get(COOKIE_ACCESS)?.value;
  const refreshToken = request.cookies.get(COOKIE_REFRESH)?.value;
  if (!accessToken && !refreshToken) return sessaoExpirada();

  let novos: Tokens | null = null;
  // Renova antes de chamar se o access token sumiu ou expira em menos de 30 s.
  if (!accessToken || segundosParaExpirar(accessToken) < 30) {
    if (!refreshToken) return sessaoExpirada();
    novos = await renovarTokens(refreshToken);
    if (!novos) return sessaoExpirada();
    accessToken = novos.accessToken;
  }

  const temCorpo = metodo !== "GET" && metodo !== "HEAD";
  const corpo = temCorpo ? await request.arrayBuffer() : null;
  const contentType = request.headers.get("content-type");
  const chamar = (token: string) =>
    chamarApi(servico as Servico, rota + request.nextUrl.search, {
      method: metodo,
      token,
      // Sem corpo, nada de Content-Type: a command responde 415 caso contrário.
      body: corpo && corpo.byteLength > 0 ? corpo : null,
      contentType: corpo && corpo.byteLength > 0 ? contentType : null,
    });

  let respostaApi: Response;
  try {
    respostaApi = await chamar(accessToken);
    if (respostaApi.status === 401 && refreshToken && !novos) {
      novos = await renovarTokens(refreshToken);
      if (!novos) return sessaoExpirada();
      respostaApi = await chamar(novos.accessToken);
    }
  } catch {
    return NextResponse.json(
      { isSuccess: false, message: "Não foi possível conectar ao servidor. Verifique sua conexão.", data: null },
      { status: 502 },
    );
  }

  const status = respostaApi.status;
  const resposta =
    status === 204 || status === 304
      ? new NextResponse(null, { status })
      : new NextResponse(await respostaApi.arrayBuffer(), {
          status,
          headers: { "Content-Type": respostaApi.headers.get("content-type") ?? "application/json" },
        });
  if (novos) gravarTokens(resposta, novos);
  return resposta;
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
