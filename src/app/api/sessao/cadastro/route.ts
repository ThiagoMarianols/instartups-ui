// Cadastro do usuário (passo 1/3). A auth não devolve token: em seguida fazemos login com as mesmas credenciais.
import { NextResponse, type NextRequest } from "next/server";
import { chamarApi, gravarTemPerfil, gravarTokens, lerJson, repassarErro } from "@/lib/api/servidor";
import type { Tokens } from "@/lib/api/tipos";

const texto = (v: unknown) => (typeof v === "string" ? v : "");

export async function POST(request: NextRequest) {
  const corpo = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const telefone = texto(corpo?.phoneNumber).replace(/\D/g, "");
  const usuario = {
    userName: texto(corpo?.userName).trim(),
    email: texto(corpo?.email).trim(),
    password: texto(corpo?.password),
    phoneNumber: telefone ? telefone : null,
  };

  try {
    const cadastro = await chamarApi("auth", "user", { method: "POST", json: usuario });
    if (!cadastro.ok) return repassarErro(cadastro);

    const login = await chamarApi("auth", "auth/login", {
      method: "POST",
      json: { userNameOrEmail: usuario.userName, password: usuario.password },
    });
    if (!login.ok) {
      // Conta criada, mas o login automático falhou: manda para o login manual.
      return NextResponse.json({ destino: "/login?cadastrado=1" });
    }
    const tokens = ((await lerJson(login)) as { data?: Tokens } | null)?.data;
    if (!tokens?.accessToken) return NextResponse.json({ destino: "/login?cadastrado=1" });

    const saida = NextResponse.json({ destino: "/cadastro/tipo" });
    gravarTokens(saida, tokens);
    gravarTemPerfil(saida, false);
    return saida;
  } catch {
    return NextResponse.json({ isSuccess: false, message: "Não foi possível conectar ao servidor. Verifique sua conexão.", data: null }, { status: 502 });
  }
}
