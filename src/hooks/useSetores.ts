"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/cliente";
import { SETORES_PADRAO, type Setor } from "@/lib/api/tipos";

/** Q5 — lista de setores. Enquanto carrega (ou se falhar), usa os 4 valores do enum. */
export function useSetores(): Setor[] {
  const { data } = useQuery({
    queryKey: ["setores"],
    queryFn: () => api<Setor[]>("query", "setores"),
    staleTime: 60 * 60_000,
  });
  return data && data.length > 0 ? data : SETORES_PADRAO;
}
