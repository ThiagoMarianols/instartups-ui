// Guarda de rotas (checagem otimista por cookies; a autorização real é das APIs).
//  - sem sessão           -> /login
//  - sessão sem perfil    -> só /cadastro/tipo e /cadastro/perfil
//  - sessão com perfil    -> /login e /cadastro* vão para /feed
import { NextResponse, type NextRequest } from "next/server";

const PUBLICAS = ["/login", "/cadastro"];
const CADASTRO_PERFIL = ["/cadastro/tipo", "/cadastro/perfil"];

const casa = (caminho: string, rota: string) => caminho === rota || caminho.startsWith(`${rota}/`);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const temSessao = Boolean(request.cookies.get("ia_rt")?.value);
  const temPerfil = request.cookies.get("ia_perfil")?.value !== "0";

  const ir = (destino: string) => NextResponse.redirect(new URL(destino, request.url));

  const ehCadastroPerfil = CADASTRO_PERFIL.some((r) => casa(pathname, r));
  const ehPublica = !ehCadastroPerfil && PUBLICAS.some((r) => pathname === r);

  if (!temSessao) {
    if (ehPublica) return NextResponse.next();
    const login = new URL("/login", request.url);
    if (pathname !== "/") login.searchParams.set("voltar", pathname + request.nextUrl.search);
    return NextResponse.redirect(login);
  }

  if (!temPerfil) {
    if (ehCadastroPerfil) return NextResponse.next();
    return ir("/cadastro/tipo");
  }

  if (ehPublica || ehCadastroPerfil) return ir("/feed");
  return NextResponse.next();
}

export const config = {
  // Arquivos do PWA ficam fora: precisam responder sem sessão (instalação e offline).
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|offline.html|icons/|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)"],
};
