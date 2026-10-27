// Marca que o usuário já tem perfil (após o 201 ou o 409 do cadastro do perfil).
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_REFRESH, gravarTemPerfil } from "@/lib/api/servidor";

export async function POST(request: NextRequest) {
  if (!request.cookies.get(COOKIE_REFRESH)?.value) {
    return NextResponse.json({ isSuccess: false, message: "Sua sessão expirou. Entre novamente.", data: null, sessaoExpirada: true }, { status: 401 });
  }
  const corpo = (await request.json().catch(() => null)) as { temPerfil?: unknown } | null;
  const saida = NextResponse.json({ destino: "/feed" });
  gravarTemPerfil(saida, corpo?.temPerfil !== false);
  return saida;
}
