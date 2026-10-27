// Gera o recorte no navegador (canvas -> Blob JPEG) a partir da área escolhida no react-easy-crop.
import type { Area } from "react-easy-crop";

function carregarImagem(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

const rad = (graus: number) => (graus * Math.PI) / 180;

function tamanhoRotacionado(w: number, h: number, rotacao: number) {
  const r = rad(rotacao);
  return {
    width: Math.abs(Math.cos(r) * w) + Math.abs(Math.sin(r) * h),
    height: Math.abs(Math.sin(r) * w) + Math.abs(Math.cos(r) * h),
  };
}

/**
 * @param larguraMax largura máxima do resultado (foto 800, capa 2000), para manter o arquivo leve.
 */
export async function recortarImagem(src: string, area: Area, rotacao: number, larguraMax: number): Promise<Blob> {
  const img = await carregarImagem(src);
  const { width: bw, height: bh } = tamanhoRotacionado(img.width, img.height, rotacao);

  // 1) Desenha a imagem inteira já rotacionada.
  const base = document.createElement("canvas");
  base.width = Math.round(bw);
  base.height = Math.round(bh);
  const ctx = base.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível.");
  ctx.translate(bw / 2, bh / 2);
  ctx.rotate(rad(rotacao));
  ctx.translate(-img.width / 2, -img.height / 2);
  ctx.drawImage(img, 0, 0);

  // 2) Copia só a área recortada, já redimensionada.
  const escala = Math.min(1, larguraMax / area.width);
  const saida = document.createElement("canvas");
  saida.width = Math.max(1, Math.round(area.width * escala));
  saida.height = Math.max(1, Math.round(area.height * escala));
  const out = saida.getContext("2d");
  if (!out) throw new Error("Canvas indisponível.");
  out.fillStyle = "#ffffff";
  out.fillRect(0, 0, saida.width, saida.height);
  out.imageSmoothingQuality = "high";
  out.drawImage(base, area.x, area.y, area.width, area.height, 0, 0, saida.width, saida.height);

  return new Promise((resolve, reject) =>
    saida.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Falha ao gerar a imagem."))), "image/jpeg", 0.9),
  );
}
