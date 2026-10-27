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
