"use client";

import { useQuery } from "@tanstack/react-query";
import { requisitar } from "@/lib/api/cliente";
import { ErroApi } from "@/lib/api/erros";
import type { Finalidade } from "@/lib/validacao/arquivos";

export const MSG_UPLOAD_DESABILITADO = "O envio de arquivos não está configurado.";
export const MSG_UPLOAD_FALHOU = "Não foi possível enviar o arquivo. Tente novamente.";

/** O upload só funciona quando o R2 está configurado no servidor do Next. */
export function useUploadHabilitado(): boolean | undefined {
  const { data } = useQuery({
    queryKey: ["upload", "habilitado"],
    queryFn: () => requisitar<{ habilitado: boolean }>("/api/upload/assinar"),
    staleTime: Infinity,
  });
  return data?.habilitado;
}

export class UploadCancelado extends Error {
  constructor() {
    super("Envio cancelado.");
    this.name = "UploadCancelado";
  }
}

/**
 * Envia o arquivo direto ao R2: pede a URL assinada ao BFF e faz o PUT com progresso.
 * Devolve a URL pública que vai para o formulário.
 */
export async function enviarArquivo(
  arquivo: Blob,
  finalidade: Finalidade,
  onProgresso: (pct: number) => void,
  signal?: AbortSignal,
): Promise<string> {
  const contentType = arquivo.type;
  const { uploadUrl, publicUrl } = await requisitar<{ uploadUrl: string; publicUrl: string }>(
    "/api/upload/assinar",
    { metodo: "POST", corpo: { finalidade, contentType, tamanho: arquivo.size }, signal },
  );

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgresso(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new ErroApi(xhr.status, MSG_UPLOAD_FALHOU));
    xhr.onerror = () => reject(new ErroApi(0, MSG_UPLOAD_FALHOU));
    xhr.onabort = () => reject(new UploadCancelado());
    if (signal) {
      if (signal.aborted) return xhr.abort();
      signal.addEventListener("abort", () => xhr.abort(), { once: true });
    }
    xhr.send(arquivo);
  });

  onProgresso(100);
  return publicUrl;
}
