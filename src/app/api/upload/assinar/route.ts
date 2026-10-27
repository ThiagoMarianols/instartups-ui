// Gera a URL assinada (presigned PUT) do Cloudflare R2. As credenciais ficam só no servidor.
// GET  -> { habilitado } (a UI desabilita o upload quando o R2 não está configurado)
// POST -> { finalidade, contentType, tamanho } => { uploadUrl, publicUrl }
import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { COOKIE_ACCESS, COOKIE_REFRESH, obterTokenValido, gravarTokens, subDoToken } from "@/lib/api/servidor";
import { extensaoDoMime, validarArquivo, type Finalidade } from "@/lib/validacao/arquivos";
import { LIMITES_PERFIL } from "@/lib/validacao/perfil";

const FINALIDADES: Finalidade[] = ["foto", "capa", "midia"];

function configuracao() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE_URL } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET || !R2_PUBLIC_BASE_URL) return null;
  return {
    bucket: R2_BUCKET,
    publicBase: R2_PUBLIC_BASE_URL.replace(/\/+$/, ""),
    cliente: new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
    }),
  };
}

const erro = (status: number, message: string) =>
  NextResponse.json({ isSuccess: false, message, data: null }, { status });

export async function GET() {
  return NextResponse.json({ habilitado: configuracao() !== null });
}

export async function POST(request: NextRequest) {
  const sessao = await obterTokenValido(
    request.cookies.get(COOKIE_ACCESS)?.value,
    request.cookies.get(COOKIE_REFRESH)?.value,
  );
  const sub = subDoToken(sessao?.token);
  if (!sessao || !sub) {
    return NextResponse.json(
      { isSuccess: false, message: "Sua sessão expirou. Entre novamente.", data: null, sessaoExpirada: true },
      { status: 401 },
    );
  }

  const config = configuracao();
  if (!config) return erro(503, "O envio de arquivos não está configurado.");

  const corpo = (await request.json().catch(() => null)) as
    | { finalidade?: unknown; contentType?: unknown; tamanho?: unknown }
    | null;
  const finalidade = corpo?.finalidade as Finalidade;
  const contentType = typeof corpo?.contentType === "string" ? corpo.contentType : "";
  const tamanho = Number(corpo?.tamanho);

  if (!FINALIDADES.includes(finalidade)) return erro(400, "Finalidade inválida.");
  if (!Number.isInteger(tamanho) || tamanho <= 0) return erro(400, "Tamanho inválido.");
  const invalido = validarArquivo(finalidade, contentType, tamanho);
  if (invalido) return erro(400, invalido);

  const chave = `${finalidade}/${sub}/${randomUUID()}.${extensaoDoMime(contentType)}`;
  const publicUrl = `${config.publicBase}/${chave}`;
  if (publicUrl.length > LIMITES_PERFIL.url) return erro(500, "URL pública maior que o permitido.");

  const uploadUrl = await getSignedUrl(
    config.cliente,
    new PutObjectCommand({ Bucket: config.bucket, Key: chave, ContentType: contentType, ContentLength: tamanho }),
    { expiresIn: 600 },
  );

  const saida = NextResponse.json({ uploadUrl, publicUrl });
  if (sessao.novos) gravarTokens(saida, sessao.novos);
  return saida;
}
