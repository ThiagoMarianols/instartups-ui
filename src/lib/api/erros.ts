// Normaliza os formatos de erro das três APIs em uma estrutura única para a UI.
//
// Formatos tratados:
//  1. Envelope command/query: { isSuccess, message, data: [{ campo, codigo, mensagem }] | null }
//  2. Envelope auth:          { isSuccess, message, data: [{ field, code, message: string[] }] | null }
//  3. Identity 409 (auth):    mesmo envelope, field em minúsculas e texto em inglês (traduzido pelo code)
//  4. ProblemDetails (auth):  { title, status, errors: { Campo: ["The X field is required."] } }
//  5. JWT 401/403 (auth):     { IsSuccess, Message, Data: "texto" } em PascalCase

export type ContextoErro = "login" | "refresh" | "geral";

export const MENSAGENS_STATUS = {
  sessaoExpirada: "Sua sessão expirou. Entre novamente.",
  bloqueado: "Usuário bloqueado. Entre em contato com o administrador.",
  limite: "Limite de requisições atingido. Tente novamente em instantes.",
  inesperado: "Erro inesperado. Tente novamente.",
  rede: "Não foi possível conectar ao servidor. Verifique sua conexão.",
  semPermissao: "Você não possui permissão para acessar este recurso.",
} as const;

const MENSAGENS_GENERICAS = new Set([
  "Erro ao executar a ação.",
  "Erro inesperado",
  "Erro de validação.",
  "Formato inválido.",
]);

const TRADUCAO_IDENTITY: Record<string, { campo: string; mensagem: string }> = {
  DuplicateUserName: { campo: "userName", mensagem: "Este nome de usuário já está em uso." },
  DuplicateEmail: { campo: "email", mensagem: "Este e-mail já está em uso." },
  InvalidUserName: { campo: "userName", mensagem: "Use apenas letras, números e - . _ @ +" },
  InvalidEmail: { campo: "email", mensagem: "Formato inválido." },
};

export class ErroApi extends Error {
  readonly status: number;
  readonly campos: Record<string, string>;
  readonly sessaoExpirada: boolean;

  constructor(status: number, mensagem: string, campos: Record<string, string> = {}, sessaoExpirada = false) {
    super(mensagem);
    this.name = "ErroApi";
    this.status = status;
    this.campos = campos;
    this.sessaoExpirada = sessaoExpirada;
  }

  get temCampos(): boolean {
    return Object.keys(this.campos).length > 0;
  }
}

const minusculaInicial = (s: string) => (s ? s[0].toLowerCase() + s.slice(1) : s);

/**
 * Converte o caminho de campo das APIs no caminho do formulário (@mantine/form).
 *   "Perfil.Nome"                 -> "perfil.nome"
 *   "Perfil.Coordenada.Latitude"  -> "perfil.coordenada" (o erro fica no mapa)
 *   "Midias[1].Url"               -> "midias.1.url"
 *   "$.ticketMinimo"              -> "ticketMinimo"
 *   "UserName" / "username"       -> "userName"
 */
export function caminhoDoCampo(campo: string): string {
  let c = campo.trim().replace(/^\$\.?/, "");
  if (!c) return "";
  c = c.replace(/\[(\d+)\]/g, ".$1");
  const partes = c.split(".").filter(Boolean).map(minusculaInicial);
  let caminho = partes.join(".");

  const apelidos: Record<string, string> = {
    username: "userName",
    phonenumber: "phoneNumber",
    newpassword: "newPassword",
    currentpassword: "currentPassword",
    usernameoremail: "userNameOrEmail",
  };
  const apelido = apelidos[caminho.toLowerCase()];
  if (apelido) caminho = apelido;

  // Latitude/longitude não têm campo próprio na tela: o erro aparece no componente de mapa.
  caminho = caminho.replace(/(^|\.)coordenada\.(latitude|longitude)$/, "$1coordenada");
  return caminho;
}

function textoProblemDetails(mensagem: string): string {
  return /required/i.test(mensagem) ? "O campo é obrigatório." : "Formato inválido.";
}

type Json = Record<string, unknown>;

function lerCampos(corpo: Json): Record<string, string> {
  const campos: Record<string, string> = {};
  const adicionar = (campo: string, mensagem: string) => {
    const caminho = caminhoDoCampo(campo);
    if (!(caminho in campos)) campos[caminho] = mensagem;
  };

  // ProblemDetails do ASP.NET (model state)
  if (corpo.errors && typeof corpo.errors === "object") {
    for (const [campo, msgs] of Object.entries(corpo.errors as Record<string, unknown>)) {
      const primeira = Array.isArray(msgs) ? String(msgs[0] ?? "") : String(msgs ?? "");
      adicionar(campo, textoProblemDetails(primeira));
    }
    return campos;
  }

  const data = corpo.data ?? corpo.Data;
  if (!Array.isArray(data)) return campos;

  for (const item of data as Json[]) {
    if (!item || typeof item !== "object") continue;
    // command/query
    if (typeof item.campo === "string") {
      adicionar(item.campo, String(item.mensagem ?? ""));
      continue;
    }
    // auth (FluentValidation ou Identity)
    if (typeof item.field === "string" || typeof item.code === "string") {
      const code = String(item.code ?? "");
      const traducao = TRADUCAO_IDENTITY[code];
      if (traducao) {
        adicionar(traducao.campo, traducao.mensagem);
        continue;
      }
      const msgs = item.message;
      const primeira = Array.isArray(msgs) ? String(msgs[0] ?? "") : String(msgs ?? "");
      adicionar(String(item.field ?? ""), primeira);
    }
  }
  delete campos[""];
  return campos;
}

function lerMensagem(corpo: Json): string | null {
  const message = corpo.message ?? corpo.Message;
  const data = corpo.data ?? corpo.Data;
  // JWT 401/403 da auth: texto real vem em Data.
  if (typeof data === "string" && data && data !== "Erro inesperado") return data;
  if (typeof message === "string" && message && !MENSAGENS_GENERICAS.has(message)) return message;
  return null;
}

/** Monta um ErroApi a partir do status e do corpo (já parseado ou nulo). */
export function normalizarErro(status: number, corpo: unknown, contexto: ContextoErro = "geral"): ErroApi {
  const json: Json = corpo && typeof corpo === "object" ? (corpo as Json) : {};

  if (json.sessaoExpirada === true) {
    return new ErroApi(401, MENSAGENS_STATUS.sessaoExpirada, {}, true);
  }

  const campos = lerCampos(json);
  const mensagemApi = lerMensagem(json);

  let mensagem: string;
  if (status === 0) {
    mensagem = MENSAGENS_STATUS.rede;
  } else if (status === 403 && (contexto === "login" || contexto === "refresh")) {
    mensagem = MENSAGENS_STATUS.bloqueado;
  } else if (status === 429) {
    mensagem = MENSAGENS_STATUS.limite;
  } else if ((status === 400 || status === 409) && Object.keys(campos).length > 0) {
    mensagem = "Erro de validação.";
  } else if (mensagemApi) {
    mensagem = mensagemApi;
  } else if (status === 401) {
    mensagem = MENSAGENS_STATUS.sessaoExpirada;
  } else if (status === 403) {
    mensagem = MENSAGENS_STATUS.semPermissao;
  } else if (status === 404) {
    mensagem = "Não encontrado.";
  } else {
    mensagem = MENSAGENS_STATUS.inesperado;
  }

  return new ErroApi(status, mensagem, campos);
}

/** Mensagem amigável para qualquer erro lançado (ErroApi ou não). */
export function mensagemDoErro(erro: unknown): string {
  if (erro instanceof ErroApi) return erro.message;
  return MENSAGENS_STATUS.inesperado;
}
