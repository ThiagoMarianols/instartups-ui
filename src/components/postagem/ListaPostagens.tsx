"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button, Loader, Skeleton, Stack, Text } from "@mantine/core";
import type { InfiniteData } from "@tanstack/react-query";
import type { Pagina, Postagem } from "@/lib/api/tipos";
import { mensagemDoErro } from "@/lib/api/erros";
import { itensDe } from "@/hooks/dados";
import { useSessao } from "@/components/app/Sessao";
import { PostCard } from "./PostCard";
import { EditarPostagemModal } from "./EditarPostagemModal";
import classes from "./postagem.module.css";

export function SkeletonPostagem() {
  return (
    <div className={classes.card} aria-hidden="true">
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Skeleton circle height={42} />
        <Stack gap={8} style={{ flex: 1 }}>
          <Skeleton height={10} width="40%" radius="xl" />
          <Skeleton height={8} width="25%" radius="xl" />
        </Stack>
      </div>
      <Skeleton height={10} radius="xl" />
      <Skeleton height={10} width="85%" radius="xl" />
      <Skeleton height={160} radius="md" />
    </div>
  );
}

interface Props {
  consulta: {
    data: InfiniteData<Pagina<Postagem>> | undefined;
    isPending: boolean;
    isError: boolean;
    error: unknown;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => unknown;
    refetch: () => unknown;
  };
  vazio: ReactNode;
}

/** Lista de postagens com rolagem infinita (cursor), skeleton, erro e estado vazio. */
export function ListaPostagens({ consulta, vazio }: Props) {
  const { perfil } = useSessao();
  const [editando, setEditando] = useState<Postagem | null>(null);
  const sentinela = useRef<HTMLDivElement>(null);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = consulta;

  useEffect(() => {
    const el = sentinela.current;
    if (!el || !hasNextPage) return;
    const obs = new IntersectionObserver(
      (entradas) => {
        if (entradas[0]?.isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "600px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (consulta.isPending) {
    return (
      <Stack gap={12} aria-busy="true" aria-label="Carregando postagens">
        <SkeletonPostagem />
        <SkeletonPostagem />
      </Stack>
    );
  }

  if (consulta.isError) {
    return (
      <Stack align="center" gap={12} py={40} ta="center">
        <Text fw={700}>Não foi possível carregar as postagens.</Text>
        <Text fz={14} c="dimmed">
          {mensagemDoErro(consulta.error)}
        </Text>
        <Button variant="default" onClick={() => consulta.refetch()}>
          Tentar novamente
        </Button>
      </Stack>
    );
  }

  const itens = itensDe(consulta.data);
  if (itens.length === 0) return <>{vazio}</>;

  return (
    <>
      <Stack gap={12}>
        {itens.map((p) => (
          <PostCard key={p.id} postagem={p} meuPerfilAtivo={perfil.ativo} onEditar={setEditando} />
        ))}
        <div ref={sentinela} />
        {isFetchingNextPage && <Loader size="sm" mx="auto" aria-label="Carregando mais postagens" />}
        {hasNextPage && !isFetchingNextPage && (
          <Button variant="subtle" color="gray" onClick={() => fetchNextPage()}>
            Carregar mais
          </Button>
        )}
      </Stack>
      <EditarPostagemModal postagem={editando} onFechar={() => setEditando(null)} />
    </>
  );
}
