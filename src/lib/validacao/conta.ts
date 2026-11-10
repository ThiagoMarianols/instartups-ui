// Regras da API auth (FluentValidation + Identity). Cada função devolve a mensagem de erro ou null.
import { MSG } from "./mensagens";

export const LIMITES_CONTA = { userName: 20, email: 100, senhaMin: 8, senhaMax: 20, telefone: 20 } as const;

// Caracteres permitidos pelo Identity (AllowedUserNameCharacters): letras ASCII, números e - . _ @ +
const USUARIO_REGEX = /^[A-Za-z0-9._@+-]+$/;

export function validarUserName(valor: string): string | null {
  const v = valor.trim();
  if (!v) return MSG.obrigatorio;
  if (v.length > LIMITES_CONTA.userName) return MSG.maxAuth(LIMITES_CONTA.userName);
  if (!USUARIO_REGEX.test(v)) return MSG.usuarioCaracteres;
  return null;
}

/** Mesmo critério do FluentValidation (modo ASP.NET): exatamente um "@", nem no início nem no fim. */
export function emailValido(email: string): boolean {
  const i = email.indexOf("@");
  return i > 0 && i === email.lastIndexOf("@") && i < email.length - 1;
}

export function validarEmail(valor: string): string | null {
  const v = valor.trim();
  if (!v) return MSG.obrigatorio;
  if (!emailValido(v)) return MSG.formato;
  if (v.length > LIMITES_CONTA.email) return MSG.maxAuth(LIMITES_CONTA.email);
  return null;
}

export interface RequisitoSenha {
  rotulo: string;
  ok: boolean;
}

/** Checklist da senha (ordem do canvas). Comprimento sem trim; complexidade após trim, como na API. */
export function requisitosSenha(senha: string): RequisitoSenha[] {
  const t = senha.trim();
  return [
    {
      rotulo: "De 8 a 20 caracteres",
      ok: senha.length >= LIMITES_CONTA.senhaMin && senha.length <= LIMITES_CONTA.senhaMax,
    },
    { rotulo: "Uma letra maiúscula", ok: /\p{Lu}/u.test(t) },
    { rotulo: "Uma letra minúscula", ok: /\p{Ll}/u.test(t) },
    { rotulo: "Um número", ok: /\p{Nd}/u.test(t) },
    { rotulo: "Um caractere especial", ok: /[^\p{L}\p{Nd}]/u.test(t) },
  ];
}

export function validarSenha(senha: string): string | null {
  if (!senha || !senha.trim()) return MSG.obrigatorio;
  if (senha.length < LIMITES_CONTA.senhaMin) return MSG.minAuth(LIMITES_CONTA.senhaMin);
  if (senha.length > LIMITES_CONTA.senhaMax) return MSG.maxAuth(LIMITES_CONTA.senhaMax);
  if (requisitosSenha(senha).slice(1).some((r) => !r.ok)) return MSG.complexidade;
  return null;
}

export function validarObrigatorio(valor: string): string | null {
  return valor && valor.trim() ? null : MSG.obrigatorio;
}

const TELEFONE_MASCARA_REGEX = /^\(\d{2}\) \d{4,5}-\d{4}$/;

export function validarTelefone(valor: string): string | null {
  const v = valor.trim();
  if (!v) return null; // opcional
  if (TELEFONE_MASCARA_REGEX.test(v)) return null;
  if (v.length > LIMITES_CONTA.telefone) return MSG.maxAuth(LIMITES_CONTA.telefone);
  if (!/^[0-9]+$/.test(v)) return MSG.formato;
  return null;
}

/** Telefone vazio vai como null (a API guarda "" como está); envia apenas os dígitos. */
export function telefoneParaApi(valor: string): string | null {
  const v = valor.replace(/\D/g, "");
  return v ? v : null;
}
