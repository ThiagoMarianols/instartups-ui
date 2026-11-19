const pad = (n: number) => String(n).padStart(2, "0");

/** Data local de hoje em yyyy-MM-dd (nunca via toISOString, que usa UTC). */
export function hojeIso(agora: Date = new Date()): string {
  return `${agora.getFullYear()}-${pad(agora.getMonth() + 1)}-${pad(agora.getDate())}`;
}

/** "2021-03-15" -> "15/03/2021" sem passar por Date (evita o deslocamento de fuso). */
export function isoParaBr(iso: string | null | undefined): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

/** Máscara progressiva dd/mm/aaaa para digitação de datas. */
export function mascararDataBr(valor: string | null | undefined): string {
  const d = (valor ?? "").replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4, 8)}`;
}

/** "15/03/2021" -> "2021-03-15" se for uma data válida do calendário; caso contrário, null. */
export function brParaIso(br: string | null | undefined): string | null {
  if (!br) return null;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br.trim());
  if (!m) return null;
  const dia = Number(m[1]);
  const mes = Number(m[2]);
  const ano = Number(m[3]);
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31 || ano < 1000) return null;
  const data = new Date(ano, mes - 1, dia);
  if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/** ISO com fuso -> "março de 2025" (no fuso local). */
export function mesAno(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

/** Data/hora ISO -> "15/03/2021" no fuso local. */
export function dataCurta(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}
