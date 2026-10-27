"use client";

import { ActionIcon, Modal } from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import type { Midia } from "@/lib/api/tipos";
import { CarrosselMidias } from "./CarrosselMidias";
import classes from "./postagem.module.css";

interface Props {
  midias: Midia[];
  autor: string;
  /** Índice da mídia aberta; null = fechado. */
  indice: number | null;
  onFechar: () => void;
}

/** Mídias da postagem em tela cheia, a partir da que foi tocada. Esc fecha. */
export function VisualizadorMidias({ midias, autor, indice, onFechar }: Props) {
  return (
    <Modal
      opened={indice !== null}
      onClose={onFechar}
      fullScreen
      padding={0}
      withCloseButton={false}
      transitionProps={{ transition: "fade", duration: 150 }}
      styles={{ content: { background: "#000" }, body: { height: "100%" } }}
    >
      {indice !== null && <CarrosselMidias midias={midias} autor={autor} inicial={indice} ampliado />}
      <ActionIcon
        className={classes.fecharVisualizador}
        variant="filled"
        color="dark"
        radius="xl"
        size={40}
        aria-label="Fechar"
        onClick={onFechar}
      >
        <IconX size={20} stroke={2.25} />
      </ActionIcon>
    </Modal>
  );
}
