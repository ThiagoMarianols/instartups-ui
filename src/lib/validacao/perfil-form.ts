// Valores, validação e conversão para DTO do formulário de perfil (cadastro POST e edição PUT).
import type {
  CodigoSetor,
  Coordenada,
  MeuPerfil,
  PerfilInvestidorDTO,
  PerfilStartupDTO,
} from "@/lib/api/tipos";
import {
  validarCoordenada,
  validarDataFundacao,
  validarImagemUrl,
  validarNome,
  validarSetor,
  validarTamanhoEquipe,
  validarTextoLongo,
  validarTicketMaximo,
  validarValor,
} from "./perfil";

export type TipoCadastro = "startup" | "investidor";

export interface ValoresPerfil extends Record<string, unknown> {
  perfil: {
    nome: string;
    imagemPerfilUrl: string | null;
    imagemFundoUrl: string | null;
    coordenada: Coordenada | null;
  };
  setor: CodigoSetor | null;
  dataFundacao: string | null;
  tamanhoEquipe: number | string;
  valorBuscado: number | string;
  pitch: string;
  teseInvestimento: string;
  ticketMinimo: number | string;
  ticketMaximo: number | string;
}

export function valoresVazios(): ValoresPerfil {
  return {
    perfil: { nome: "", imagemPerfilUrl: null, imagemFundoUrl: null, coordenada: null },
    setor: null,
    dataFundacao: null,
    tamanhoEquipe: "",
    valorBuscado: "",
    pitch: "",
    teseInvestimento: "",
    ticketMinimo: "",
    ticketMaximo: "",
  };
}

/** Pré-preenche a edição com a Q1 (o PUT substitui tudo). */
export function valoresDoPerfil(p: MeuPerfil): ValoresPerfil {
  const v = valoresVazios();
  v.perfil = {
    nome: p.nome,
    imagemPerfilUrl: p.imagemPerfilUrl,
    imagemFundoUrl: p.imagemFundoUrl,
    coordenada: p.coordenada,
  };
  if (p.startup) {
    v.setor = p.startup.setor;
    v.dataFundacao = p.startup.dataFundacao;
    v.tamanhoEquipe = p.startup.tamanhoEquipe;
    v.valorBuscado = p.startup.valorBuscado;
    v.pitch = p.startup.pitch;
  }
  if (p.investidor) {
    v.teseInvestimento = p.investidor.teseInvestimento;
    v.ticketMinimo = p.investidor.ticketMinimo;
    v.ticketMaximo = p.investidor.ticketMaximo;
  }
  return v;
}

/** Regras do canvas/API. Só os campos do tipo escolhido são validados. */
export function validarPerfil(tipo: TipoCadastro, v: ValoresPerfil): Record<string, string | null> {
  const erros: Record<string, string | null> = {
    "perfil.nome": validarNome(v.perfil.nome),
    "perfil.imagemPerfilUrl": validarImagemUrl(v.perfil.imagemPerfilUrl),
    "perfil.imagemFundoUrl": validarImagemUrl(v.perfil.imagemFundoUrl),
    "perfil.coordenada": validarCoordenada(v.perfil.coordenada),
  };
  if (tipo === "startup") {
    erros.setor = validarSetor(v.setor);
    erros.dataFundacao = validarDataFundacao(v.dataFundacao);
    erros.tamanhoEquipe = validarTamanhoEquipe(v.tamanhoEquipe);
    erros.valorBuscado = validarValor(v.valorBuscado);
    erros.pitch = validarTextoLongo(v.pitch);
  } else {
    erros.teseInvestimento = validarTextoLongo(v.teseInvestimento);
    erros.ticketMinimo = validarValor(v.ticketMinimo);
    erros.ticketMaximo = validarTicketMaximo(v.ticketMaximo, v.ticketMinimo);
  }
  return erros;
}

export function contarErros(erros: Record<string, unknown>): number {
  return Object.values(erros).filter(Boolean).length;
}

function perfilComum(v: ValoresPerfil) {
  return {
    nome: v.perfil.nome.trim(),
    imagemPerfilUrl: v.perfil.imagemPerfilUrl || null,
    imagemFundoUrl: v.perfil.imagemFundoUrl || null,
    coordenada: v.perfil.coordenada as Coordenada,
  };
}

export function paraDtoStartup(v: ValoresPerfil): PerfilStartupDTO {
  return {
    perfil: perfilComum(v),
    pitch: v.pitch.trim(),
    dataFundacao: v.dataFundacao as string,
    tamanhoEquipe: Number(v.tamanhoEquipe),
    valorBuscado: Number(v.valorBuscado),
    setor: v.setor as CodigoSetor,
  };
}

export function paraDtoInvestidor(v: ValoresPerfil): PerfilInvestidorDTO {
  return {
    perfil: perfilComum(v),
    teseInvestimento: v.teseInvestimento.trim(),
    ticketMinimo: Number(v.ticketMinimo),
    ticketMaximo: Number(v.ticketMaximo),
  };
}
