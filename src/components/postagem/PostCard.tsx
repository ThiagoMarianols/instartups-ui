"use client";

import { useRef, useState, type MouseEvent, type PointerEvent } from "react";
import Link from "next/link";
import { ActionIcon, Anchor, Button, Group, Menu, Stack, Text, Tooltip } from "@mantine/core";
import { IconBan, IconDots, IconHeart, IconHeartBroken, IconHeartFilled, IconPencil } from "@tabler/icons-react";
import type { Postagem } from "@/lib/api/tipos";
import { rotuloSetor } from "@/lib/api/tipos";
import { formatarKm, formatarNumero } from "@/lib/formato/moeda";
import { tempoRelativo } from "@/lib/formato/tempo-relativo";
import { useCurtir, useStatusPostagem } from "@/hooks/dados";
import { confirmar, TEXTOS_CONFIRMACAO } from "@/lib/confirmar";
import { notificarSucesso } from "@/lib/notificar";
import { AvatarPerfil } from "@/components/comum/AvatarPerfil";
import { BadgeDesativada, BadgeTipo } from "@/components/comum/Badges";
import { CarrosselMidias } from "./CarrosselMidias";
import { VisualizadorMidias } from "./VisualizadorMidias";
import classes from "./postagem.module.css";

interface Props {
  postagem: Postagem;
  /** Meu perfil está ativo? Desativado, não posso curtir nem editar. */
  meuPerfilAtivo: boolean;
  onEditar?: (p: Postagem) => void;
}

const INTERATIVO = "a, button, video, input, textarea, [role='menu'], [role='menuitem']";

function ehInterativo(alvo: EventTarget | null): boolean {
  return alvo instanceof Element && Boolean(alvo.closest(INTERATIVO));
}

function meta(p: Postagem): string {
  const partes: string[] = [];
  if (p.autor.setor) partes.push(rotuloSetor(p.autor.setor));
  if (p.autor.ehMeu) partes.push("sua postagem");
  else partes.push(formatarKm(p.autor.distanciaKm));
  partes.push(tempoRelativo(p.dataCriacao));
  if (!p.ativo && p.autor.ehMeu) partes.push("visível só para você");
  return partes.join(" · ");
}

/** Card de postagem (artboard "Componente · Card de postagem"). */
export function PostCard({ postagem: p, meuPerfilAtivo, onEditar }: Props) {
  const curtir = useCurtir();
  const status = useStatusPostagem();
  const [ampliada, setAmpliada] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ chave: number; acao: "curtir" | "descurtir"; alvo: "card" | "midia" } | null>(null);
  const contadorFeedback = useRef(0);
  const inicioToque = useRef<{ x: number; y: number } | null>(null);
  const ultimoToque = useRef<{ tempo: number; x: number; y: number } | null>(null);
  const ultimoDuploToque = useRef(0);

  const href = p.autor.ehMeu ? "/perfil/me" : `/perfil/${p.autor.id}`;
  const propria = p.autor.ehMeu;
  const desativada = !p.ativo;
  const curtiu = p.curtidaPorMim && !propria;
  const podeCurtir = !propria && !desativada && meuPerfilAtivo;

  const alternarPorDuploClique = (alvo: "card" | "midia") => {
    if (!podeCurtir || curtir.isPending) return;
    const proximo = !curtiu;
    contadorFeedback.current += 1;
    setFeedback({ chave: contadorFeedback.current, acao: proximo ? "curtir" : "descurtir", alvo });
    curtir.mutate({ id: p.id, curtir: proximo });
  };

  const aoPressionarPonteiro = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "touch" || ehInterativo(e.target)) {
      inicioToque.current = null;
      return;
    }
    inicioToque.current = { x: e.clientX, y: e.clientY };
  };

  const aoSoltarPonteiro = (e: PointerEvent<HTMLElement>) => {
    const inicio = inicioToque.current;
    inicioToque.current = null;
    if (e.pointerType !== "touch" || !inicio || ehInterativo(e.target)) return;
    if (Math.hypot(e.clientX - inicio.x, e.clientY - inicio.y) >= 12) return;

    const agora = Date.now();
    const anterior = ultimoToque.current;
    if (anterior && agora - anterior.tempo < 300 && Math.hypot(e.clientX - anterior.x, e.clientY - anterior.y) < 40) {
      ultimoToque.current = null;
      ultimoDuploToque.current = agora;
      alternarPorDuploClique("card");
      return;
    }
    ultimoToque.current = { tempo: agora, x: e.clientX, y: e.clientY };
  };

  const aoCancelarPonteiro = () => {
    inicioToque.current = null;
  };

  const aoDuploClique = (e: MouseEvent<HTMLElement>) => {
    if (!podeCurtir || curtir.isPending || ehInterativo(e.target)) return;
    if (Date.now() - ultimoDuploToque.current < 400) return;
    window.getSelection()?.removeAllRanges();
    alternarPorDuploClique("card");
  };

  const renderFeedback = (alvo: "card" | "midia") => {
    if (feedback?.alvo !== alvo) return null;
    return (
      <span
        key={feedback.chave}
        className={classes.feedbackCurtida}
        data-acao={feedback.acao}
        aria-hidden="true"
        onAnimationEnd={() => setFeedback((atual) => (atual?.chave === feedback.chave ? null : atual))}
      >
        {feedback.acao === "curtir" ? <IconHeartFilled size={76} /> : <IconHeartBroken size={46} stroke={1.75} />}
      </span>
    );
  };

  const desativar = () =>
    confirmar({
      titulo: "Desativar postagem?",
      texto: TEXTOS_CONFIRMACAO.desativarPostagem,
      confirmar: "Desativar",
      onConfirmar: () =>
        status.mutate({ id: p.id, ativar: false }, { onSuccess: () => notificarSucesso("Postagem desativada.") }),
    });

  const rotuloCurtidas = p.totalCurtidas === 1 ? "curtida" : "curtidas";

  const botaoCurtir = (
    <button
      type="button"
      className={classes.curtir}
      data-curtiu={curtiu || undefined}
      disabled={!podeCurtir || curtir.isPending}
      aria-pressed={propria ? undefined : curtiu}
      aria-label={propria ? "Curtir (indisponível na própria postagem)" : curtiu ? "Descurtir" : "Curtir"}
      onClick={() => curtir.mutate({ id: p.id, curtir: !curtiu })}
    >
      {curtiu ? <IconHeartFilled size={20} /> : <IconHeart size={20} stroke={1.75} />}
      <span className={classes.contagem}>
        {formatarNumero(p.totalCurtidas)}{" "}
        <span className={classes.rotuloCurtidas}>{rotuloCurtidas}</span>
      </span>
    </button>
  );

  return (
    <article
      className={classes.card}
      data-desativada={desativada || undefined}
      aria-label={`Postagem de ${p.autor.nome}`}
      onPointerDown={aoPressionarPonteiro}
      onPointerUp={aoSoltarPonteiro}
      onPointerCancel={aoCancelarPonteiro}
      onDoubleClick={aoDuploClique}
    >
      {renderFeedback("card")}
      <Group gap={12} wrap="nowrap" align="center">
        <Anchor component={Link} href={href} aria-label={`Abrir perfil de ${p.autor.nome}`} style={{ flex: "none" }}>
          <AvatarPerfil nome={p.autor.nome} tipo={p.autor.tipo} src={p.autor.imagemPerfilUrl} tamanho={42} />
        </Anchor>
        <Stack gap={3} style={{ flex: 1, minWidth: 0 }}>
          <Group gap={8} wrap="wrap">
            <Anchor component={Link} href={href} fz={15} fw={700} c="var(--mantine-color-text)" underline="hover">
              {p.autor.nome}
            </Anchor>
            <BadgeTipo tipo={p.autor.tipo} size="xs" />
            {desativada && <BadgeDesativada size="xs" />}
          </Group>
          <Text fz={13} c="dimmed">
            {meta(p)}
          </Text>
        </Stack>
        {propria && desativada && (
          <Button
            variant="default"
            size="compact-sm"
            h={30}
            disabled={!meuPerfilAtivo}
            loading={status.isPending}
            onClick={() =>
              status.mutate({ id: p.id, ativar: true }, { onSuccess: () => notificarSucesso("Postagem reativada.") })
            }
          >
            Reativar
          </Button>
        )}
        {propria && !desativada && (
          <Menu position="bottom-end" width={200} shadow="md">
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray" size={34} aria-label="Ações da postagem" disabled={!meuPerfilAtivo}>
                <IconDots size={20} stroke={1.75} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconPencil size={16} stroke={1.75} />} onClick={() => onEditar?.(p)}>
                Editar postagem
              </Menu.Item>
              <Menu.Item color="red" leftSection={<IconBan size={16} stroke={1.75} />} onClick={desativar}>
                Desativar postagem
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>

      <p className={classes.descricao} data-desativada={desativada || undefined}>
        {p.descricao}
      </p>

      {p.midias.length > 0 && (
        <div className={classes.midiaWrapper}>
          <CarrosselMidias
            midias={p.midias}
            autor={p.autor.nome}
            onAbrir={setAmpliada}
            onDuploCliqueFoto={podeCurtir ? () => alternarPorDuploClique("midia") : undefined}
          />
          {renderFeedback("midia")}
        </div>
      )}
      <VisualizadorMidias midias={p.midias} autor={p.autor.nome} indice={ampliada} onFechar={() => setAmpliada(null)} />

      <div>
        {propria ? (
          <Tooltip label="Um perfil não pode curtir a própria postagem." position="top-start">
            <span>{botaoCurtir}</span>
          </Tooltip>
        ) : (
          botaoCurtir
        )}
      </div>
    </article>
  );
}
