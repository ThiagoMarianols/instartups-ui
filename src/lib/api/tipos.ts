// Contratos das APIs (auth, command, query). Campos em camelCase, como chegam no JSON.

export type TipoPerfil = "STARTUP" | "INVESTIDOR";
export type CodigoSetor =
  | "AGRONEGOCIOS"
  | "FINANCAS"
  | "SAUDE"
  | "VAREJO"
  // Tecnologia (10)
  | "INTELIGENCIA_ARTIFICIAL"
  | "CIBERSEGURANCA"
  | "CLOUD_COMPUTING"
  | "BLOCKCHAIN"
  | "INTERNET_DAS_COISAS"
  | "BIOTECNOLOGIA"
  | "BIG_DATA"
  | "DESENVOLVIMENTO_SOFTWARE"
  | "REALIDADE_VIRTUAL"
  | "ROBOTICA"
  // Outros setores (10)
  | "EDUCACAO"
  | "ENERGIA"
  | "LOGISTICA"
  | "IMOBILIARIO"
  | "ALIMENTOS"
  | "MEIO_AMBIENTE"
  | "JURIDICO"
  | "RECURSOS_HUMANOS"
  | "MARKETING"
  | "TURISMO";
export type TipoMidia = "FOTO" | "VIDEO";
export type FiltroTipo = "todos" | "startup" | "investidor";

export interface Coordenada {
  latitude: number;
  longitude: number;
}

export interface Pagina<T> {
  itens: T[];
  proximoCursor: string | null;
  temMais: boolean;
}

// ---------- Auth ----------
export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface UsuarioMe {
  id: string;
  userName: string;
  email: string;
  phoneNumber: string | null;
}

// ---------- Query ----------
export interface StartupDetalhe {
  pitch: string;
  dataFundacao: string; // yyyy-MM-dd
  tamanhoEquipe: number;
  valorBuscado: number;
  setor: CodigoSetor;
}

export interface InvestidorDetalhe {
  teseInvestimento: string;
  ticketMinimo: number;
  ticketMaximo: number;
}

interface PerfilBase {
  id: string;
  tipo: TipoPerfil;
  nome: string;
  usuario: string | null;
  imagemPerfilUrl: string | null;
  imagemFundoUrl: string | null;
  totalSeguidores: number;
  totalSeguindo: number;
  totalCurtidas: number;
  ativo: boolean;
  dataCriacao: string;
  startup: StartupDetalhe | null;
  investidor: InvestidorDetalhe | null;
}

/** Q1 — GET /perfil/me */
export interface MeuPerfil extends PerfilBase {
  coordenada: Coordenada;
}

/** Q2 — GET /perfil/{id} */
export interface PerfilPublico extends PerfilBase {
  distanciaKm: number | null;
  seguindoPorMim: boolean;
}

export interface Midia {
  id: string;
  url: string;
  tipo: TipoMidia;
}

export interface AutorPostagem {
  id: string;
  nome: string;
  tipo: TipoPerfil;
  imagemPerfilUrl: string | null;
  setor: CodigoSetor | null;
  distanciaKm: number;
  ehMeu: boolean;
}

/** Item de Q3/Q4/Q6 */
export interface Postagem {
  id: string;
  descricao: string;
  dataCriacao: string;
  totalCurtidas: number;
  curtidaPorMim: boolean;
  ativo: boolean;
  midias: Midia[];
  autor: AutorPostagem;
}

/** Q5 */
export interface Setor {
  codigo: CodigoSetor;
  rotulo: string;
}

/** Item de Q7 */
export interface PerfilBusca {
  id: string;
  nome: string;
  tipo: TipoPerfil;
  imagemPerfilUrl: string | null;
  usuario: string | null;
  setor: CodigoSetor | null;
  resumo: string | null;
  distanciaKm: number;
  seguindoPorMim: boolean;
  ehMeu: boolean;
  encontradoPor: "email" | "nome" | "usuario";
}

// ---------- Command (corpos) ----------
export interface PerfilComumDTO {
  nome: string;
  imagemPerfilUrl: string | null;
  imagemFundoUrl: string | null;
  coordenada: Coordenada;
}

export interface PerfilStartupDTO {
  perfil: PerfilComumDTO;
  pitch: string;
  dataFundacao: string;
  tamanhoEquipe: number;
  valorBuscado: number;
  setor: CodigoSetor;
}

export interface PerfilInvestidorDTO {
  perfil: PerfilComumDTO;
  teseInvestimento: string;
  ticketMinimo: number;
  ticketMaximo: number;
}

export interface MidiaNovaDTO {
  url: string;
  tipo: TipoMidia;
}

export interface CadastrarPostagemDTO {
  descricao: string;
  midias: MidiaNovaDTO[] | null;
}

export interface EditarPostagemDTO {
  descricao: string;
  midiasRemovidas: string[];
  midiasAdicionadas: MidiaNovaDTO[];
}

export const SETORES_PADRAO: Setor[] = [
  // Setores originais
  { codigo: "AGRONEGOCIOS", rotulo: "Agronegócios" },
  { codigo: "FINANCAS", rotulo: "Finanças" },
  { codigo: "SAUDE", rotulo: "Saúde" },
  { codigo: "VAREJO", rotulo: "Varejo" },
  // Tecnologia (10)
  { codigo: "INTELIGENCIA_ARTIFICIAL", rotulo: "Inteligência Artificial" },
  { codigo: "CIBERSEGURANCA", rotulo: "Cibersegurança" },
  { codigo: "CLOUD_COMPUTING", rotulo: "Computação em Nuvem (Cloud)" },
  { codigo: "BLOCKCHAIN", rotulo: "Blockchain e Criptoeconomia" },
  { codigo: "INTERNET_DAS_COISAS", rotulo: "Internet das Coisas (IoT)" },
  { codigo: "BIOTECNOLOGIA", rotulo: "Biotecnologia" },
  { codigo: "BIG_DATA", rotulo: "Big Data e Analytics" },
  { codigo: "DESENVOLVIMENTO_SOFTWARE", rotulo: "Software e SaaS" },
  { codigo: "REALIDADE_VIRTUAL", rotulo: "Realidade Virtual e Aumentada (VR/AR)" },
  { codigo: "ROBOTICA", rotulo: "Robótica e Automação" },
  // Outros setores (10)
  { codigo: "EDUCACAO", rotulo: "Educação" },
  { codigo: "ENERGIA", rotulo: "Energia e Sustentabilidade" },
  { codigo: "LOGISTICA", rotulo: "Logística e Transporte" },
  { codigo: "IMOBILIARIO", rotulo: "Imobiliário" },
  { codigo: "ALIMENTOS", rotulo: "Alimentos e Bebidas" },
  { codigo: "MEIO_AMBIENTE", rotulo: "Meio Ambiente e Clima" },
  { codigo: "JURIDICO", rotulo: "Jurídico" },
  { codigo: "RECURSOS_HUMANOS", rotulo: "Recursos Humanos" },
  { codigo: "MARKETING", rotulo: "Marketing e Vendas" },
  { codigo: "TURISMO", rotulo: "Turismo e Hotelaria" },
];

export function rotuloSetor(codigo: CodigoSetor | null | undefined): string {
  if (!codigo) return "";
  return SETORES_PADRAO.find((s) => s.codigo === codigo)?.rotulo ?? codigo;
}
