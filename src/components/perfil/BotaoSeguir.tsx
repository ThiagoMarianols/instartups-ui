"use client";

import { Button, Tooltip } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { confirmar } from "@/lib/confirmar";

/** Seguir / Seguindo. Deixar de seguir pede confirmação. */
export function BotaoSeguir({
  seguindo,
  nome,
  desabilitado,
  motivo,
  onAlternar,
  compacto,
}: {
  seguindo: boolean;
  nome: string;
  desabilitado?: boolean;
  motivo?: string;
  onAlternar: (seguir: boolean) => void;
  compacto?: boolean;
}) {
  const clicar = () => {
    if (!seguindo) return onAlternar(true);
    confirmar({
      titulo: `Deixar de seguir ${nome}?`,
      confirmar: "Deixar de seguir",
      destrutivo: false,
      onConfirmar: () => onAlternar(false),
    });
  };
  const botao = (
    <Button
      onClick={clicar}
      disabled={desabilitado}
      variant={seguindo ? "default" : "filled"}
      aria-pressed={seguindo}
      h={compacto ? 34 : 38}
      px={compacto ? 16 : 20}
      leftSection={seguindo && !compacto ? <IconCheck size={16} stroke={2.5} /> : undefined}
    >
      {seguindo ? "Seguindo" : "Seguir"}
    </Button>
  );
  return motivo ? (
    <Tooltip label={motivo}>
      <span>{botao}</span>
    </Tooltip>
  ) : (
    botao
  );
}
