// Sai deste dispositivo: revoga o refresh token atual e limpa os cookies.
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_ACCESS, COOKIE_REFRESH, chamarApi, limparSessao, obterTokenValido } from "@/lib/api/servidor";

export async function POST(request: NextRequest) {
  const access = request.cookies.get(COOKIE_ACCESS)?.value;
  const refresh = request.cookies.get(COOKIE_REFRESH)?.value;
  try {
    const sessao = await obterTokenValido(access, refresh);
    if (sessao) {
      const refreshAtual = sessao.novos?.refreshToken ?? refresh;
      await chamarApi("auth", "auth/logout", { method: "POST", token: sessao.token, json: { refreshToken: refreshAtual } });
    }
  } catch {
    // Mesmo sem conseguir revogar no servidor, a sessão local é encerrada.
  }
  const saida = NextResponse.json({ destino: "/login" });
  limparSessao(saida);
  return saida;
}
