// Filtros do feed guardados na URL (?tipo=&raio=&setores=).
import type { CodigoSetor, FiltroTipo } from "@/lib/api/tipos";
import { SETORES_VALIDOS } from "@/lib/validacao/perfil";

export interface FiltrosFeed {
  tipo: FiltroTipo;
  raio: number | null;
  /** Ficam guardados, mas só valem na aba Startups. */
  setores: CodigoSetor[];
}

export const MARCAS_KM = [5, 25, 50, 100, 250, 500];
export const RAIO_MAX = 20000;

export const FILTROS_PADRAO: FiltrosFeed = { tipo: "todos", raio: null, setores: [] };

export function lerFiltros(params: URLSearchParams): FiltrosFeed {
  const tipo = params.get("tipo");
  const raio = Number(params.get("raio"));
  const setores = (params.get("setores") ?? "")
    .split(",")
    .filter((s): s is CodigoSetor => (SETORES_VALIDOS as string[]).includes(s));
  return {
    tipo: tipo === "startup" || tipo === "investidor" ? tipo : "todos",
    raio: Number.isInteger(raio) && raio > 0 && raio <= RAIO_MAX ? raio : null,
    setores: [...new Set(setores)],
  };
}

export function filtrosParaUrl(f: FiltrosFeed): string {
  const p = new URLSearchParams();
  if (f.tipo !== "todos") p.set("tipo", f.tipo);
  if (f.raio !== null) p.set("raio", String(f.raio));
  if (f.setores.length > 0) p.set("setores", f.setores.join(","));
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** Parâmetros da Q3. Setor só vai junto com tipo=startup. */
export function paramsDoFeed(f: FiltrosFeed) {
  return {
    tipo: f.tipo,
    raioKm: f.raio ?? undefined,
    setores: f.tipo === "startup" && f.setores.length > 0 ? f.setores : undefined,
  };
}

/** Quantos filtros estão ativos (contador do botão "Filtros"). */
export function contarFiltros(f: FiltrosFeed): number {
  return (f.raio !== null ? 1 : 0) + (f.tipo === "startup" ? f.setores.length : 0);
}
