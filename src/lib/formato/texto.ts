/** "Vitalis Saúde" -> "VS"; "AgroSense" -> "AG". */
export function iniciais(nome: string | null | undefined): string {
  const partes = (nome ?? "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return Array.from(partes[0]).slice(0, 2).join("").toUpperCase();
  return (Array.from(partes[0])[0] + Array.from(partes[partes.length - 1])[0]).toUpperCase();
}

export function plural(n: number, singular: string, pluralTexto: string): string {
  return n === 1 ? singular : pluralTexto;
}

/** Mantém apenas dígitos numéricos [0-9], opcionalmente limitando o tamanho. */
export function apenasDigitos(valor: string | null | undefined, max?: number): string {
  const digitos = (valor ?? "").replace(/\D/g, "");
  return max !== undefined ? digitos.slice(0, max) : digitos;
}

/** "16999990000" -> "(16) 99999-0000"; "1633334444" -> "(16) 3333-4444". */
export function formatarTelefone(valor: string | null | undefined): string {
  const d = apenasDigitos(valor, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

/** Mantém apenas caracteres permitidos pelo Identity (letras ASCII, números e - . _ @ +) até o limite. */
export function mascararUserName(valor: string | null | undefined, max = 20): string {
  return (valor ?? "").replace(/[^A-Za-z0-9._@+-]/g, "").slice(0, max);
}
