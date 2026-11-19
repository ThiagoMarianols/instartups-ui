# InStartups — Front-end

Next.js 16 (App Router) + Mantine 9, fiel ao canvas **"InStartups — Telas"**.
O navegador fala só com o próprio Next (BFF); o Next fala com as APIs **auth** (:8080), **command** (:8081) e **query** (:8082).

## Rodando

```bash
cp .env.local.example .env.local   # ajuste as URLs se precisar
npm install
npm run dev                        # http://localhost:3000
```

Pré-requisitos: Postgres + PostGIS (porta 5433) e as três APIs no ar. Para ter dados, rode `python scripts/seed/seed.py` na raiz do projeto. Todos os usuários do seed usam a senha `Senha@123` (ex.: `paymangue`, `vivasaude`, `olindaangels`).

| Script | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` / `npm start` | build e servidor de produção |
| `npm run lint` · `npm run typecheck` | ESLint e TypeScript |
| `npm test` | testes unitários (Vitest): validações, erros, formatos, filtros, refresh |
| `npm run test:e2e` | testes e2e (Playwright) com o app e as APIs no ar; usuário em `E2E_USUARIO`/`E2E_SENHA` |

> Cada login abre uma sessão, e a auth aceita no máximo **3 sessões ativas por usuário**, sem expirar a mais antiga. Sempre saia ("Sair") ao testar. Os testes e2e já fazem logout.

## Arquitetura

- **BFF** (`src/app/api`):
  - `/api/sessao/*`: login, cadastro, logout e logout-todos. Grava os tokens em cookies `httpOnly` (`ia_at`, `ia_rt`) e o flag `ia_perfil`.
  - `/api/bff/{auth|command|query}/...`: proxy com allowlist. Injeta o `Bearer` e renova a sessão no servidor com **refresh single-flight**, porque a auth rotaciona o refresh token e revoga o antigo.
  - Nenhuma API precisa liberar CORS.
- **Guarda de rotas** (`src/proxy.ts`):
  - Sem sessão → `/login`.
  - Sessão sem perfil → `/cadastro/tipo`.
  - Com perfil, `/login` e `/cadastro` → `/feed`.
- **Erros** (`src/lib/api/erros.ts`): normaliza os formatos das três APIs, incluindo os casos da auth:
  - ProblemDetails, Identity em inglês traduzido e JWT em PascalCase.
  - Saída: `{status, mensagem, campos}`. Os campos vão para o formulário (`Perfil.Coordenada.Latitude` → `perfil.coordenada`).
- **Validações** (`src/lib/validacao`): espelho exato das regras da auth e da command, com testes. Detalhes no plano do projeto.

## Upload de imagens e mídias (Cloudflare R2)

Sem as variáveis `R2_*`, o upload aparece desabilitado: os botões ficam inativos, com o aviso "O envio de arquivos não está configurado.". O restante do app funciona normalmente.

Para habilitar:

1. **Crie um bucket no R2** e um token de API com permissão de *Object Read & Write* nesse bucket.
2. **Preencha o `.env.local`:**
   - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` e `R2_BUCKET`.
   - `R2_PUBLIC_BASE_URL`: domínio próprio ou `https://pub-xxxx.r2.dev`, sem barra no final.
3. **Libere o acesso público de leitura** do bucket (domínio ou r2.dev).
4. **Configure o CORS do bucket**, para o navegador fazer o PUT direto:
   ```json
   [{ "AllowedOrigins": ["http://localhost:3000", "https://instartups.tech"], "AllowedMethods": ["PUT"], "AllowedHeaders": ["Content-Type"], "MaxAgeSeconds": 3600 }]
   ```

O fluxo:

1. O usuário escolhe o arquivo; fotos e capas passam pelo recorte.
2. O front pede uma URL assinada (`POST /api/upload/assinar`, com credenciais só no servidor).
3. O navegador faz o PUT direto no R2, com barra de progresso e cancelamento.
4. Só a URL pública vai para a API command.

**Limites:**
- Imagens: PNG/JPG até 10 MB.
- Vídeos (só em postagens): MP4/MOV até 50 MB.
- Até 10 mídias por postagem.

## Deploy (Docker Swarm pelo Portainer)

Mesmo padrão das APIs. Guia do servidor (Traefik, DNS, certificados): `INSTARTUPS/infra/README.md`.

| Arquivo | O que é |
|---|---|
| `infra/Dockerfile` | Imagem `node:22-alpine` com o `output: "standalone"` do Next, usuário não-root, porta 3000 |
| `infra/docker-compose.yml` | Stack do Swarm: Traefik em `FRONT_DOMAIN` e `www.FRONT_DOMAIN` (o `www` redireciona para o raiz), healthcheck em `/api/saude` |
| `infra/.env.example` | Variáveis da stack (cadastre no Portainer) |
| `.github/workflows/ci-cd.yml` | Lint, tipos e testes; depois build e push para `ghcr.io/ThiagoMarianols/instartups-ui` |

Branches: `develop`, `homolog` e `main`. Cada push publica a imagem com a tag da branch (`main` também vira `latest`); tags `vX.Y.Z` publicam `X.Y.Z` e `X.Y`. Pull requests só buildam.

Todas as variáveis são lidas em runtime no servidor, então a mesma imagem serve qualquer ambiente. Para testar a imagem localmente:

```bash
docker build -f infra/Dockerfile -t instartups-ui:local .
docker run --rm -p 3000:3000 --env-file .env.local instartups-ui:local
```

> Dentro do container, `localhost` é o próprio container: para usar as APIs da sua máquina, troque as URLs por `http://host.docker.internal:808x`.

## Decisões em relação ao canvas

- Limite de **10 mídias** por postagem, como na API; o canvas dizia 5.
- **Busca:**
  - O front remove o `@` inicial. A busca sem acento depende do back (`unaccent` na Q7, pendente).
  - A Q7 não devolve totais por aba, então o contador aparece só na aba ativa.
- **"Ajustar" enquadramento** só existe para imagens escolhidas na sessão atual. Imagens já salvas podem ser trocadas ou removidas.