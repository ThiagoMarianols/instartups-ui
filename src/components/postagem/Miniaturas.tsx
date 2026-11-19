"use client";

import { ActionIcon, Badge, Button, Progress, Text } from "@mantine/core";
import { IconAlertCircle, IconCrop, IconX } from "@tabler/icons-react";
import type { HTMLAttributes, Ref, SyntheticEvent } from "react";
import type { TipoMidia } from "@/lib/api/tipos";
import classes from "./postagem.module.css";

function Conteudo({ src, tipo }: { src: string; tipo: TipoMidia }) {
  return tipo === "VIDEO" ? (
    <video src={src} muted playsInline preload="metadata" aria-label="Vídeo" />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" draggable={false} />
  );
}

/** Mídia já salva na postagem (edição): pode ser marcada para remoção. */
export function MiniaturaExistente({ url, tipo, removida, onAlternar }: { url: string; tipo: TipoMidia; removida: boolean; onAlternar: () => void }) {
  if (removida) {
    return (
      <div className={classes.removida}>
        <Text fz={12} fw={600} c="var(--app-err-text)">
          Será removida
        </Text>
        <Text fz={11}>{tipo === "VIDEO" ? "VÍDEO" : "FOTO"}</Text>
        <Button variant="default" size="compact-xs" onClick={onAlternar}>
          Desfazer
        </Button>
      </div>
    );
  }
  return (
    <div className={classes.miniatura}>
      <Conteudo src={url} tipo={tipo} />
      <ActionIcon className={classes.fecharMidia} radius="xl" aria-label="Remover mídia" onClick={onAlternar}>
        <IconX size={14} stroke={2.5} />
      </ActionIcon>
    </div>
  );
}

/** Botões dentro de uma miniatura arrastável não podem iniciar o arrasto. */
const parar = (e: SyntheticEvent) => e.stopPropagation();
const naoArrastar = { onMouseDown: parar, onTouchStart: parar, onKeyDown: parar };

/** Mídia nova (ainda enviando, pronta ou com erro). */
export function MiniaturaNova({
  preview,
  tipo,
  progresso,
  pronta,
  erro,
  onRemover,
  posicao,
  onAjustar,
  arrasto,
}: {
  preview: string;
  tipo: TipoMidia;
  progresso: number;
  pronta: boolean;
  erro: string | null;
  onRemover: () => void;
  /** Posição no carrossel (1 = primeira), exibida quando a ordem pode mudar. */
  posicao?: number;
  /** Abre o ajuste (só fotos). */
  onAjustar?: () => void;
  /** Props do container quando a miniatura é ordenável (ref, estilo, listeners). */
  arrasto?: HTMLAttributes<HTMLDivElement> & { ref?: Ref<HTMLDivElement>; arrastando?: boolean };
}) {
  const enviando = !pronta && !erro;
  const { arrastando, ...container } = arrasto ?? {};
  return (
    <div
      {...container}
      className={classes.miniatura}
      data-enviando={enviando || undefined}
      data-ordenavel={arrasto ? true : undefined}
      data-arrastando={arrastando || undefined}
    >
      <Conteudo src={preview} tipo={tipo} />
      <Badge className={classes.rotuloMidia} size="xs" radius="xl" color="dark">
        {tipo === "VIDEO" ? "VÍDEO · NOVO" : "FOTO · NOVO"}
      </Badge>
      {posicao !== undefined && (
        <span className={classes.posicaoMidia} aria-hidden>
          {posicao}
        </span>
      )}
      {onAjustar && tipo === "FOTO" && (
        <ActionIcon
          {...naoArrastar}
          className={classes.fecharMidia}
          data-ajustar
          radius="xl"
          aria-label="Ajustar foto"
          onClick={onAjustar}
        >
          <IconCrop size={14} stroke={2.25} />
        </ActionIcon>
      )}
      <ActionIcon
        {...naoArrastar}
        className={classes.fecharMidia}
        radius="xl"
        aria-label={enviando ? "Cancelar envio" : "Remover mídia"}
        onClick={onRemover}
      >
        <IconX size={14} stroke={2.5} />
      </ActionIcon>
      {enviando && (
        <div className={classes.progressoMidia}>
          <Text fz={11} fw={600}>
            Enviando… {progresso}%
          </Text>
          <Progress value={progresso} size={4} aria-label="Progresso do envio" />
        </div>
      )}
      {erro && (
        <div className={classes.progressoMidia} role="alert">
          <Text fz={11} fw={600} c="var(--app-err-text)" style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <IconAlertCircle size={12} /> {erro}
          </Text>
        </div>
      )}
    </div>
  );
}
