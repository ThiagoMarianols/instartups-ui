"use client";

// Consultas (API de Query) e mutações (API Command) compartilhadas entre as telas.
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api/cliente";
import type { MeuPerfil, Pagina, PerfilBusca, PerfilPublico, Postagem, UsuarioMe } from "@/lib/api/tipos";
import { notificarErro } from "@/lib/notificar";

export const LIMITE_PAGINA = 20;

export const chaves = {
  meuPerfil: ["perfil", "me"] as const,
  usuario: ["usuario", "me"] as const,
  perfil: (id: string) => ["perfil", id] as const,
  postagens: ["postagens"] as const,
  feed: (filtros: object) => ["postagens", "feed", filtros] as const,
  postagensPerfil: (id: string) => ["postagens", "perfil", id] as const,
  busca: ["busca"] as const,
};

/** Q1 — meu perfil (inclui desativado). */
export function useMeuPerfil() {
  return useQuery({ queryKey: chaves.meuPerfil, queryFn: () => api<MeuPerfil>("query", "perfil/me") });
}

/** Auth — dados da conta (userName, e-mail, telefone). */
export function useUsuario() {
  return useQuery({ queryKey: chaves.usuario, queryFn: () => api<UsuarioMe>("auth", "user/me") });
}

/** Q2 — perfil público. */
export function usePerfilPublico(id: string, habilitado = true) {
  return useQuery({
    queryKey: chaves.perfil(id),
    queryFn: () => api<PerfilPublico>("query", `perfil/${id}`),
    enabled: habilitado,
  });
}

type Params = Record<string, string | number | string[] | null | undefined>;

/** Lista paginada por cursor (Q3, Q4, Q7). */
export function useListaPaginada<T>(chave: readonly unknown[], caminho: string, params: Params = {}, habilitado = true) {
  return useInfiniteQuery({
    queryKey: chave,
    queryFn: ({ pageParam, signal }) =>
      api<Pagina<T>>("query", caminho, { params: { ...params, limite: LIMITE_PAGINA, cursor: pageParam ?? undefined }, signal }),
    initialPageParam: null as string | null,
    getNextPageParam: (ultima) => (ultima.temMais ? ultima.proximoCursor : undefined),
    enabled: habilitado,
  });
}

export function itensDe<T>(data: InfiniteData<Pagina<T>> | undefined): T[] {
  return data?.pages.flatMap((p) => p.itens) ?? [];
}

/** Atualiza uma postagem em todas as listas em cache (feed, perfis). */
export function atualizarPostagemNoCache(qc: QueryClient, id: string, fn: (p: Postagem) => Postagem) {
  qc.setQueriesData<InfiniteData<Pagina<Postagem>>>({ queryKey: chaves.postagens }, (data) =>
    data
      ? { ...data, pages: data.pages.map((pg) => ({ ...pg, itens: pg.itens.map((p) => (p.id === id ? fn(p) : p)) })) }
      : data,
  );
}

/** Curtir/descurtir com contador otimista (POST/DELETE /postagem/{id}/curtir). */
export function useCurtir() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, curtir }: { id: string; curtir: boolean }) =>
      api("command", `postagem/${id}/curtir`, { metodo: curtir ? "POST" : "DELETE" }),
    onMutate: async ({ id, curtir }) => {
      await qc.cancelQueries({ queryKey: chaves.postagens });
      atualizarPostagemNoCache(qc, id, (p) => ({
        ...p,
        curtidaPorMim: curtir,
        totalCurtidas: Math.max(0, p.totalCurtidas + (curtir ? 1 : -1)),
      }));
    },
    onError: (erro, { id, curtir }) => {
      atualizarPostagemNoCache(qc, id, (p) => ({
        ...p,
        curtidaPorMim: !curtir,
        totalCurtidas: Math.max(0, p.totalCurtidas + (curtir ? -1 : 1)),
      }));
      notificarErro(erro);
    },
  });
}

/** Atualiza o estado "seguindo" em perfil público e resultados de busca. */
function aplicarSeguir(qc: QueryClient, perfilId: string, seguir: boolean) {
  qc.setQueryData<PerfilPublico>(chaves.perfil(perfilId), (p) =>
    p ? { ...p, seguindoPorMim: seguir, totalSeguidores: Math.max(0, p.totalSeguidores + (seguir ? 1 : -1)) } : p,
  );
  qc.setQueriesData<InfiniteData<Pagina<PerfilBusca>>>({ queryKey: chaves.busca }, (data) =>
    data
      ? {
          ...data,
          pages: data.pages.map((pg) => ({
            ...pg,
            itens: pg.itens.map((r) => (r.id === perfilId ? { ...r, seguindoPorMim: seguir } : r)),
          })),
        }
      : data,
  );
}

/** Seguir/deixar de seguir (id do PERFIL). */
export function useSeguir() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ perfilId, seguir }: { perfilId: string; seguir: boolean }) =>
      api("command", `perfil/${perfilId}/seguir`, { metodo: seguir ? "POST" : "DELETE" }),
    onMutate: ({ perfilId, seguir }) => aplicarSeguir(qc, perfilId, seguir),
    onError: (erro, { perfilId, seguir }) => {
      aplicarSeguir(qc, perfilId, !seguir);
      notificarErro(erro);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: chaves.meuPerfil }),
  });
}

/** Desativar/reativar postagem própria. */
export function useStatusPostagem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ativar }: { id: string; ativar: boolean }) =>
      api("command", `postagem/${id}/${ativar ? "reativar" : "desativar"}`, { metodo: "PATCH" }),
    onSuccess: (_, { id, ativar }) => {
      atualizarPostagemNoCache(qc, id, (p) => ({ ...p, ativo: ativar }));
      qc.invalidateQueries({ queryKey: chaves.postagens });
      qc.invalidateQueries({ queryKey: chaves.meuPerfil });
    },
    onError: (erro) => notificarErro(erro),
  });
}

/** Desativar/reativar o próprio perfil. */
export function useStatusPerfil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ativar: boolean) => api("command", `perfil/${ativar ? "reativar" : "desativar"}`, { metodo: "PATCH" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chaves.meuPerfil });
      qc.invalidateQueries({ queryKey: chaves.postagens });
    },
    onError: (erro) => notificarErro(erro),
  });
}
