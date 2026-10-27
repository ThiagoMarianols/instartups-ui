"use client";

import Link from "next/link";
import { Anchor, Button, Group, Stack, Text } from "@mantine/core";
import { IconMapPin } from "@tabler/icons-react";
import { rotuloSetor } from "@/lib/api/tipos";
import { formatarNumero } from "@/lib/formato/moeda";
import { useSessao } from "@/components/app/Sessao";
import { AvatarPerfil } from "@/components/comum/AvatarPerfil";
import { BadgeDesativada, BadgeTipo } from "@/components/comum/Badges";
import { MapaLocal } from "@/components/mapa/MapaLocal";
import classes from "./feed.module.css";

/** Coluna lateral do feed: resumo do meu perfil e mini mapa com o raio do filtro. */
export function ResumoPerfil({ raio }: { raio: number | null }) {
  const { perfil } = useSessao();
  return (
    <aside aria-label="Resumo do seu perfil" style={{ display: "contents" }}>
      <div className={classes.cartao}>
        <div className={classes.capa}>
          {perfil.imagemFundoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={perfil.imagemFundoUrl} alt="" />
          )}
        </div>
        <Stack gap={10} px={16} pb={16}>
          <AvatarPerfil
            nome={perfil.nome}
            tipo={perfil.tipo}
            src={perfil.imagemPerfilUrl}
            tamanho={52}
            mt={-26}
            style={{ border: "3px solid var(--app-surface)", boxSizing: "content-box" }}
          />
          <Group gap={8}>
            <Text fz={16} fw={700}>
              {perfil.nome}
            </Text>
            <BadgeTipo tipo={perfil.tipo} size="xs" />
            {!perfil.ativo && <BadgeDesativada size="xs" rotulo="DESATIVADO" />}
          </Group>
          <Text fz={13} c="dimmed">
            @{perfil.usuario}
            {perfil.startup ? ` · ${rotuloSetor(perfil.startup.setor)}` : ""}
          </Text>
          <div className={classes.contadores}>
            <span>
              <strong>{formatarNumero(perfil.totalSeguidores)}</strong>
              <Text component="span" fz={12} c="dimmed">
                seguidores
              </Text>
            </span>
            <span>
              <strong>{formatarNumero(perfil.totalSeguindo)}</strong>
              <Text component="span" fz={12} c="dimmed">
                seguindo
              </Text>
            </span>
            <span>
              <strong>{formatarNumero(perfil.totalCurtidas)}</strong>
              <Text component="span" fz={12} c="dimmed">
                curtidas
              </Text>
            </span>
          </div>
          <Button component={Link} href="/perfil/me" variant="default" h={36}>
            Ver meu perfil
          </Button>
        </Stack>
      </div>

      <div className={classes.cartao} style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
        <Group gap={8}>
          <IconMapPin size={18} stroke={1.75} aria-hidden />
          <Text fz={14} fw={700}>
            Sua localização
          </Text>
        </Group>
        <MapaLocal valor={perfil.coordenada} mini raioKm={raio} altura={150} />
        <Text fz={12} c="dimmed">
          {raio === null
            ? "A distância dos filtros é medida a partir deste ponto."
            : `O círculo mostra o raio de ${formatarNumero(raio)} km aplicado no feed.`}
        </Text>
        <Anchor component={Link} href="/configuracoes#cfg-local" fz={13} fw={600} c="var(--mantine-color-text)" underline="always">
          Atualizar localização
        </Anchor>
      </div>
    </aside>
  );
}
