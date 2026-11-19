import { NextResponse, type NextRequest } from "next/server";
import { chamarApi, consultarTemPerfil, gravarTemPerfil, gravarTokens, lerJson, repassarErro } from "@/lib/api/servidor";
import type { Tokens } from "@/lib/api/tipos";

export async function POST(request: NextRequest) {
  const corpo = (await request.json().catch(() => null)) as { userNameOrEmail?: unknown; password?: unknown } | null;
  const credenciais = {
    userNameOrEmail: typeof corpo?.userNameOrEmail === "string" ? corpo.userNameOrEmail : "",
    password: typeof corpo?.password === "string" ? corpo.password : "",
  };

  let resposta: Response;
  try {
    resposta = await chamarApi("auth", "auth/login", { method: "POST", json: credenciais });
  } catch {
    return NextResponse.json({ isSuccess: false, message: "Não foi possível conectar ao servidor. Verifique sua conexão.", data: null }, { status: 502 });
  }
  if (!resposta.ok) return repassarErro(resposta);

  const json = (await lerJson(resposta)) as { data?: Tokens } | null;
  const tokens = json?.data;
  if (!tokens?.accessToken) {
    return NextResponse.json({ isSuccess: false, message: "Erro inesperado. Tente novamente.", data: null }, { status: 502 });
  }

  const temPerfil = await consultarTemPerfil(tokens.accessToken);
  const saida = NextResponse.json({ destino: temPerfil ? "/feed" : "/cadastro/tipo" });
  gravarTokens(saida, tokens);
  gravarTemPerfil(saida, temPerfil);
  return saida;
}
