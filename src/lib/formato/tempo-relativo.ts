import { dataCurta } from "./data";

const MIN = 60_000;
const HORA = 60 * MIN;

function inicioDoDia(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * Tempo relativo no estilo do canvas: "agora", "há 5 min", "há 2 h", "ontem",
 * "há 3 dias", "há 1 semana", depois a data (dd/mm/aaaa).
 */
export function tempoRelativo(iso: string, agora: Date = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diff = agora.getTime() - d.getTime();
  if (diff < MIN) return "agora";
  if (diff < HORA) return `há ${Math.floor(diff / MIN)} min`;

  const dias = Math.round((inicioDoDia(agora) - inicioDoDia(d)) / (24 * HORA));
  if (dias === 0) return `há ${Math.floor(diff / HORA)} h`;
  if (dias === 1) return diff < 24 * HORA ? `há ${Math.floor(diff / HORA)} h` : "ontem";
  if (dias < 7) return `há ${dias} dias`;
  const semanas = Math.floor(dias / 7);
  if (semanas < 5) return semanas === 1 ? "há 1 semana" : `há ${semanas} semanas`;
  return dataCurta(iso);
}
