"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/cliente";
import { SETORES_PADRAO, type Setor } from "@/lib/api/tipos";

/** Q5 — lista de setores. Combina os setores padrão com os da API (ou usa o padrão se offline/vazio). */
export function useSetores(): Setor[] {
  const { data } = useQuery({
    queryKey: ["setores"],
    queryFn: () => api<Setor[]>("query", "setores"),
    staleTime: 60 * 60_000,
  });

  if (!data || data.length === 0) return SETORES_PADRAO;

  const mapa = new Map<string, Setor>();
  for (const s of SETORES_PADRAO) {
    mapa.set(s.codigo, s);
  }
  for (const s of data) {
    mapa.set(s.codigo, s);
  }
  return Array.from(mapa.values());
}
