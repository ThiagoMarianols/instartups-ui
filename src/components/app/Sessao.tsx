"use client";

import { createContext, useContext } from "react";
import type { MeuPerfil } from "@/lib/api/tipos";

export interface Sessao {
  perfil: MeuPerfil;
  abrirNovaPostagem: () => void;
}

export const SessaoContexto = createContext<Sessao | null>(null);

/** Perfil do usuário logado (Q1), garantido dentro das telas do app. */
export function useSessao(): Sessao {
  const sessao = useContext(SessaoContexto);
  if (!sessao) throw new Error("useSessao fora do ShellApp");
  return sessao;
}
