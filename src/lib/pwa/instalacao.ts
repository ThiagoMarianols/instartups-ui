// Regras do aviso de instalação do PWA (sem acesso a window: testável no node).

export const CHAVE_DISPENSADO = "ia_pwa_dispensado";
export const DIAS_DISPENSADO = 14;

const DIA_MS = 24 * 60 * 60 * 1000;

/**
 * Script inline do <head> (layout raiz): o Chromium pode disparar o `beforeinstallprompt`
 * antes do React hidratar, então o evento é guardado em window e avisado por "ia:instalavel".
 */
export const SCRIPT_CAPTURA_INSTALACAO =
  'window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__iaPromptInstalacao=e;window.dispatchEvent(new Event("ia:instalavel"))});';

/** iPhone/iPod/iPad, incluindo o iPadOS que se apresenta como "Macintosh" com tela de toque. */
export function ehIos(userAgent: string, maxTouchPoints = 0): boolean {
  if (/iPad|iPhone|iPod/.test(userAgent)) return true;
  return /Macintosh/.test(userAgent) && maxTouchPoints > 1;
}

/**
 * No iOS só o Safari instala o PWA e não há `beforeinstallprompt`: o aviso vira instrução manual.
 * Chrome (CriOS), Firefox (FxiOS), Edge (EdgiOS) e afins ficam de fora.
 */
export function ehSafariIos(userAgent: string, maxTouchPoints = 0): boolean {
  if (!ehIos(userAgent, maxTouchPoints)) return false;
  return /Safari/.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA|DuckDuckGo|Instagram|FBAN|FBAV/.test(userAgent);
}

/** "Agora não" vale por DIAS_DISPENSADO dias. Valor ausente ou inválido não bloqueia. */
export function dispensadoRecente(valor: string | null, agora: number): boolean {
  const quando = Number(valor);
  if (!valor || !Number.isFinite(quando)) return false;
  return agora - quando < DIAS_DISPENSADO * DIA_MS;
}
