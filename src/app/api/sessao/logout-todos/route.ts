// Sai de todos os dispositivos (POST /api/auth/logout/all).
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_ACCESS, COOKIE_REFRESH, chamarApi, limparSessao, obterTokenValido, repassarErro } from "@/lib/api/servidor";

export async function POST(request: NextRequest) {
  const sessao = await obterTokenValido(
    request.cookies.get(COOKIE_ACCESS)?.value,
    request.cookies.get(COOKIE_REFRESH)?.value,
  );
  if (sessao) {
    try {
      const resposta = await chamarApi("auth", "auth/logout/all", { method: "POST", token: sessao.token });
      if (!resposta.ok && resposta.status !== 401) return repassarErro(resposta);
    } catch {
      return NextResponse.json({ isSuccess: false, message: "Não foi possível conectar ao servidor. Verifique sua conexão.", data: null }, { status: 502 });
    }
  }
  const saida = NextResponse.json({ destino: "/login" });
  limparSessao(saida);
  return saida;
}
