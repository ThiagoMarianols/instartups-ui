export const BUSCA_MIN = 2;
export const BUSCA_MAX = 100;

/** Normaliza o termo para a Q7: trim e sem "@" inicial (a API não remove). */
export function normalizarTermo(termo: string): string {
  return termo.trim().replace(/^@+/, "").trim();
}

/** Termo pronto para enviar, ou null se ainda não atingiu o mínimo. */
export function termoParaBusca(termo: string): string | null {
  const t = normalizarTermo(termo);
  if (t.length < BUSCA_MIN) return null;
  return t.slice(0, BUSCA_MAX);
}

/** Remove acentos e caixa para comparar e realçar trechos. */
export function semAcento(texto: string): string {
  return texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/**
 * Divide o texto em [antes, trecho, depois] para realçar o termo, ignorando acentos.
 * A normalização NFD pode mudar o comprimento, então o mapeamento é feito caractere a caractere.
 */
export function realcar(texto: string, termo: string): [string, string, string] {
  const alvo = semAcento(termo);
  if (!alvo) return [texto, "", ""];
  const chars = Array.from(texto);
  const normalizados = chars.map((c) => semAcento(c));
  const plano = normalizados.join("");
  const pos = plano.indexOf(alvo);
  if (pos < 0) return [texto, "", ""];
  let acumulado = 0;
  let inicio = -1;
  let fim = chars.length;
  for (let i = 0; i < chars.length; i++) {
    if (inicio < 0 && acumulado >= pos) inicio = i;
    acumulado += normalizados[i].length;
    if (inicio >= 0 && acumulado >= pos + alvo.length) {
      fim = i + 1;
      break;
    }
  }
  if (inicio < 0) return [texto, "", ""];
  return [chars.slice(0, inicio).join(""), chars.slice(inicio, fim).join(""), chars.slice(fim).join("")];
}
