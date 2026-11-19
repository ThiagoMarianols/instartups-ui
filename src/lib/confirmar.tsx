"use client";

// Modais de confirmação do canvas (Feedback · Modal de confirmação).
import { Text } from "@mantine/core";
import { modals } from "@mantine/modals";

interface Opcoes {
  titulo: string;
  texto?: string;
  confirmar: string;
  destrutivo?: boolean;
  onConfirmar: () => void;
}

export function confirmar({ titulo, texto, confirmar, destrutivo = true, onConfirmar }: Opcoes) {
  modals.openConfirmModal({
    title: titulo,
    centered: true,
    radius: "md",
    children: texto ? (
      <Text fz={14} lh={1.55}>
        {texto}
      </Text>
    ) : null,
    labels: { confirm: confirmar, cancel: "Cancelar" },
    confirmProps: { color: destrutivo ? "red" : undefined },
    cancelProps: { variant: "default" },
    closeButtonProps: { "aria-label": "Fechar" },
    styles: { title: { fontSize: 18, fontWeight: 700 } },
    onConfirm: onConfirmar,
  });
}

export const TEXTOS_CONFIRMACAO = {
  desativarPerfil:
    "Enquanto o perfil estiver desativado você não poderá editá-lo, publicar, curtir nem seguir. Suas postagens continuam no ar. Você pode reativar quando quiser.",
  desativarPostagem:
    "A postagem sai do feed e as curtidas dela deixam de contar no seu perfil. Você pode reativá-la depois em Meu perfil.",
};
