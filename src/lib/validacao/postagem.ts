import { MSG } from "./mensagens";
import { MAX_MIDIAS, MSG_ARQUIVO } from "./arquivos";

export const LIMITE_DESCRICAO = 500;

export function validarDescricao(valor: string): string | null {
  if (!valor || !valor.trim()) return MSG.obrigatorio;
  if (valor.length > LIMITE_DESCRICAO) return MSG.maxCommand(LIMITE_DESCRICAO);
  return null;
}

/** Total final de mídias (na edição: existentes − removidas + novas). */
export function validarTotalMidias(total: number): string | null {
  return total > MAX_MIDIAS ? MSG_ARQUIVO.limiteMidias : null;
}
