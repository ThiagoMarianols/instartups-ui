"use client";

import { Button, Group, Stack, Text } from "@mantine/core";
import { IconBan } from "@tabler/icons-react";
import { useStatusPerfil } from "@/hooks/dados";
import { notificarSucesso } from "@/lib/notificar";
import classes from "./perfil.module.css";

/** Alert fixo do perfil desativado (artboard 14). Único botão ativo: Reativar perfil. */
export function AlertaPerfilDesativado() {
  const status = useStatusPerfil();
  return (
    <div role="alert" className={classes.alertaDesativado}>
      <Group gap={12} align="flex-start" wrap="nowrap" style={{ flex: "1 1 360px" }}>
        <IconBan size={20} stroke={2} color="var(--app-err-text)" style={{ flex: "none", marginTop: 1 }} aria-hidden />
        <Stack gap={4}>
          <Text fz={14} fw={700} c="var(--app-err-text)">
            Seu perfil está desativado
          </Text>
          <Text fz={13} lh={1.5}>
            Enquanto estiver desativado, você não pode editar o perfil, publicar, curtir nem seguir. Suas postagens continuam no ar.
          </Text>
        </Stack>
      </Group>
      <Button
        h={36}
        loading={status.isPending}
        onClick={() => status.mutate(true, { onSuccess: () => notificarSucesso("Perfil reativado.") })}
      >
        Reativar perfil
      </Button>
    </div>
  );
}
