// Regras da API command para perfis (startup e investidor).
import type { CodigoSetor, Coordenada } from "@/lib/api/tipos";
import { formatarMoeda } from "@/lib/formato/moeda";
import { hojeIso } from "@/lib/formato/data";
import { MSG } from "./mensagens";

export const LIMITES_PERFIL = {
  nome: 100,
  url: 400,
  texto: 1000,
  equipeMin: 1,
  equipeMax: 32767,
  valorMax: 9_999_999_999.99,
} as const;

export const SETORES_VALIDOS: CodigoSetor[] = ["FINANCAS", "SAUDE", "AGRONEGOCIOS", "VAREJO"];

/** Nome: obrigatório após trim; limite contado antes do trim (como na API). */
export function validarNome(valor: string): string | null {
  if (!valor || !valor.trim()) return MSG.obrigatorio;
  if (valor.length > LIMITES_PERFIL.nome) return MSG.maxCommand(LIMITES_PERFIL.nome);
  return null;
}

export function urlValida(valor: string): boolean {
  try {
    const url = new URL(valor);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Imagens: null quando ausente; nunca "". */
export function validarImagemUrl(valor: string | null): string | null {
  if (valor === null) return null;
  if (valor.length > LIMITES_PERFIL.url) return MSG.maxCommand(LIMITES_PERFIL.url);
  if (!urlValida(valor)) return MSG.url;
  return null;
}

export function validarCoordenada(c: Coordenada | null): string | null {
  if (!c) return MSG.obrigatorio;
  const { latitude, longitude } = c;
  if (!Number.isFinite(latitude) || latitude === 0 || !Number.isFinite(longitude) || longitude === 0) {
    return MSG.obrigatorio;
  }
  if (latitude < -90 || latitude > 90) return MSG.entre(-90, 90);
  if (longitude < -180 || longitude > 180) return MSG.entre(-180, 180);
  return null;
}

export function validarSetor(valor: string | null): string | null {
  return valor && (SETORES_VALIDOS as string[]).includes(valor) ? null : MSG.enumInvalido;
}

/** Data no formato yyyy-MM-dd, até hoje. */
export function validarDataFundacao(valor: string | null): string | null {
  if (!valor) return MSG.obrigatorio;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return MSG.formato;
  if (valor > hojeIso()) return MSG.dataFutura;
  return null;
}

type Numero = number | string | null | undefined;

const comoNumero = (v: Numero): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

export function validarTamanhoEquipe(valor: Numero): string | null {
  const n = comoNumero(valor);
  if (n === null) return MSG.obrigatorio;
  if (!Number.isInteger(n) || n < LIMITES_PERFIL.equipeMin || n > LIMITES_PERFIL.equipeMax) {
    return MSG.entre(LIMITES_PERFIL.equipeMin, LIMITES_PERFIL.equipeMax);
  }
  return null;
}

/** Valores em reais: obrigatório, > 0, até 9.999.999.999,99 com 2 casas. */
export function validarValor(valor: Numero): string | null {
  const n = comoNumero(valor);
  if (n === null) return MSG.obrigatorio;
  if (n <= 0) return MSG.maiorQue(0);
  if (n > LIMITES_PERFIL.valorMax || Math.abs(Math.round(n * 100) - n * 100) > 1e-6) return MSG.precisao;
  return null;
}

/** Ticket máximo: além das regras de valor, estritamente maior que o mínimo. */
export function validarTicketMaximo(maximo: Numero, minimo: Numero): string | null {
  const erro = validarValor(maximo);
  if (erro) return erro;
  const min = comoNumero(minimo);
  const max = comoNumero(maximo);
  if (min !== null && min > 0 && max !== null && max <= min) return MSG.maiorQue(formatarMoeda(min));
  return null;
}

export function validarTextoLongo(valor: string): string | null {
  if (!valor || !valor.trim()) return MSG.obrigatorio;
  if (valor.length > LIMITES_PERFIL.texto) return MSG.maxCommand(LIMITES_PERFIL.texto);
  return null;
}
