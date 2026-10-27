"use client";

import type { ReactNode } from "react";
import { Group, Stack, Text, Title } from "@mantine/core";
import { IconPhoto } from "@tabler/icons-react";
import type { MeuPerfil, PerfilPublico } from "@/lib/api/tipos";
import { rotuloSetor } from "@/lib/api/tipos";
import { formatarKm, formatarMoeda, formatarNumero } from "@/lib/formato/moeda";
import { isoParaBr, mesAno } from "@/lib/formato/data";
import { AvatarPerfil } from "@/components/comum/AvatarPerfil";
import { BadgeDesativada, BadgeTipo } from "@/components/comum/Badges";
import classes from "./perfil.module.css";

type Perfil = MeuPerfil | PerfilPublico;

function distancia(p: Perfil): number | null {
  return "distanciaKm" in p ? p.distanciaKm : null;
}

/** Capa, avatar, nome, badges, meta e contadores (artboards 08/09/10). */
export function CabecalhoPerfil({ perfil, acao }: { perfil: Perfil; acao: ReactNode }) {
  const km = distancia(perfil);
  const meta = [
    perfil.startup ? rotuloSetor(perfil.startup.setor) : null,
    km !== null ? `${formatarKm(km)} de você` : null,
    `No InStartups desde ${mesAno(perfil.dataCriacao)}`,
  ].filter(Boolean) as string[];

  return (
    <section className={classes.cartao} aria-label={`Perfil de ${perfil.nome}`}>
      <div className={classes.capa}>
        {perfil.imagemFundoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={perfil.imagemFundoUrl} alt="" />
        ) : (
          <IconPhoto size={32} stroke={1.25} aria-hidden />
        )}
      </div>
      <div className={classes.corpo}>
        <div className={classes.topo}>
          <AvatarPerfil
            nome={perfil.nome}
            tipo={perfil.tipo}
            src={perfil.imagemPerfilUrl}
            tamanho={112}
            className={classes.avatar}
          />
          {acao}
        </div>

        <Stack gap={6}>
          <Group gap={10} wrap="wrap">
            <Title order={1} fz={26} style={{ letterSpacing: "-0.01em" }}>
              {perfil.nome}
            </Title>
            <BadgeTipo tipo={perfil.tipo} />
            {!perfil.ativo && <BadgeDesativada rotulo="DESATIVADO" />}
          </Group>
          <Group gap={16} wrap="wrap">
            {meta.map((m) => (
              <Text key={m} fz={14} c="dimmed">
                {m}
              </Text>
            ))}
          </Group>
        </Stack>

        <Group gap={24} wrap="wrap">
          <Text fz={14}>
            <strong style={{ fontSize: 16 }}>{formatarNumero(perfil.totalSeguidores)}</strong>{" "}
            <Text component="span" fz={14} c="dimmed">
              seguidores
            </Text>
          </Text>
          <Text fz={14}>
            <strong style={{ fontSize: 16 }}>{formatarNumero(perfil.totalSeguindo)}</strong>{" "}
            <Text component="span" fz={14} c="dimmed">
              seguindo
            </Text>
          </Text>
          <Text fz={14}>
            <strong style={{ fontSize: 16 }}>{formatarNumero(perfil.totalCurtidas)}</strong>{" "}
            <Text component="span" fz={14} c="dimmed">
              curtidas recebidas
            </Text>
          </Text>
        </Group>
      </div>
    </section>
  );
}

/** Bloco "Pitch" (startup) ou "Tese de investimento" (investidor). */
export function SobrePerfil({ perfil }: { perfil: Perfil }) {
  const s = perfil.startup;
  const i = perfil.investidor;
  const titulo = s ? "Pitch" : "Tese de investimento";
  const texto = s?.pitch ?? i?.teseInvestimento ?? "";
  const stats = s
    ? [
        { rotulo: "Fundação", valor: isoParaBr(s.dataFundacao) },
        { rotulo: "Equipe", valor: `${formatarNumero(s.tamanhoEquipe)} ${s.tamanhoEquipe === 1 ? "pessoa" : "pessoas"}` },
        { rotulo: "Valor buscado", valor: formatarMoeda(s.valorBuscado) },
      ]
    : i
      ? [
          { rotulo: "Ticket mínimo", valor: formatarMoeda(i.ticketMinimo) },
          { rotulo: "Ticket máximo", valor: formatarMoeda(i.ticketMaximo) },
        ]
      : [];

  return (
    <section className={classes.sobre} aria-labelledby="perfil-sobre">
      <Text
        id="perfil-sobre"
        component="h2"
        m={0}
        fz={13}
        fw={700}
        c="dimmed"
        tt="uppercase"
        style={{ letterSpacing: "0.06em" }}
      >
        {titulo}
      </Text>
      <Text fz={16} lh={1.6} style={{ whiteSpace: "pre-line", overflowWrap: "anywhere" }}>
        {texto}
      </Text>
      <div className={classes.stats} style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}>
        {stats.map((st) => (
          <div key={st.rotulo} className={classes.stat}>
            <Text fz={12} c="dimmed">
              {st.rotulo}
            </Text>
            <Text fz={16} fw={700}>
              {st.valor}
            </Text>
          </div>
        ))}
      </div>
    </section>
  );
}
