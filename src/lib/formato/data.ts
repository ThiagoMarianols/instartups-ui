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
