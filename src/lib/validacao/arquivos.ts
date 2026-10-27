// Regras de arquivo para upload (imagens de perfil/capa e mídias de postagem).
import type { TipoMidia } from "@/lib/api/tipos";

export const MB = 1024 ** 2;
export const IMAGEM_MIME = ["image/png", "image/jpeg"] as const;
export const VIDEO_MIME = ["video/mp4", "video/quicktime"] as const;
export const IMAGEM_MAX = 10 * MB;
export const VIDEO_MAX = 50 * MB;
export const MAX_MIDIAS = 10;

export type Finalidade = "foto" | "capa" | "midia";

export const MSG_ARQUIVO = {
  formatoImagem: "Formato não suportado. Use PNG ou JPG.",
  formatoMidia: "Formato não suportado. Use PNG, JPG, MP4 ou MOV.",
  imagemGrande: "Arquivo maior que 10 MB.",
  videoGrande: "Vídeo maior que 50 MB.",
  limiteMidias: `Limite de ${MAX_MIDIAS} mídias por postagem.`,
} as const;

export function tipoMidiaDoMime(mime: string): TipoMidia | null {
  if ((IMAGEM_MIME as readonly string[]).includes(mime)) return "FOTO";
  if ((VIDEO_MIME as readonly string[]).includes(mime)) return "VIDEO";
  return null;
}

export function extensaoDoMime(mime: string): string | null {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "video/mp4":
      return "mp4";
    case "video/quicktime":
      return "mov";
    default:
      return null;
  }
}

/** Valida tipo e tamanho; devolve a mensagem de erro ou null. */
export function validarArquivo(finalidade: Finalidade, mime: string, tamanho: number): string | null {
  const tipo = tipoMidiaDoMime(mime);
  if (finalidade !== "midia") {
    if (tipo !== "FOTO") return MSG_ARQUIVO.formatoImagem;
    if (tamanho > IMAGEM_MAX) return MSG_ARQUIVO.imagemGrande;
    return tamanho > 0 ? null : MSG_ARQUIVO.formatoImagem;
  }
  if (!tipo) return MSG_ARQUIVO.formatoMidia;
  if (tipo === "FOTO" && tamanho > IMAGEM_MAX) return MSG_ARQUIVO.imagemGrande;
  if (tipo === "VIDEO" && tamanho > VIDEO_MAX) return MSG_ARQUIVO.videoGrande;
  return tamanho > 0 ? null : MSG_ARQUIVO.formatoMidia;
}
