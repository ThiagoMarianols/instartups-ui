"use client";

import { IconNews } from "@tabler/icons-react";
import type { Postagem } from "@/lib/api/tipos";
import { chaves, itensDe, useListaPaginada } from "@/hooks/dados";
import { Abas } from "@/components/comum/Abas";
import { EstadoVazio } from "@/components/comum/EstadoVazio";
import { ListaPostagens } from "@/components/postagem/ListaPostagens";
import { Text } from "@mantine/core";
import feed from "@/components/feed/feed.module.css";

/** Aba "Postagens" de um perfil (Q4). No meu perfil inclui as desativadas. */
export function AbaPostagens({ perfilId, proprio }: { perfilId: string; proprio: boolean }) {
  const consulta = useListaPaginada<Postagem>(chaves.postagensPerfil(perfilId), `perfil/${perfilId}/postagens`);
  const n = itensDe(consulta.data).length;
  const contagem = consulta.isPending ? "" : `${n}${consulta.hasNextPage ? "+" : ""}`;

  return (
    <>
      <div className={feed.barraAbas} style={{ justifyContent: "flex-start" }}>
        <Abas
          rotulo="Conteúdo do perfil"
          valor="postagens"
          onChange={() => undefined}
          abas={[
            {
              valor: "postagens",
              rotulo: (
                <>
                  Postagens{" "}
                  <Text component="span" fw={500} c="dimmed" fz={15}>
                    {contagem}
                  </Text>
                </>
              ),
            },
          ]}
        />
      </div>
      <ListaPostagens
        consulta={consulta}
        vazio={
          <EstadoVazio
            icone={<IconNews size={26} stroke={1.75} />}
            titulo={proprio ? "Você ainda não publicou" : "Nenhuma postagem ainda"}
            texto={proprio ? "Use “Nova postagem” para compartilhar uma novidade." : undefined}
          />
        }
      />
    </>
  );
}
