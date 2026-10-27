"use client";

import Link from "next/link";
import { Anchor, Text } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/cliente";
import type { UsuarioMe } from "@/lib/api/tipos";
import { Logo } from "@/components/Logo";
import classes from "./cadastro.module.css";

/** Cabeçalho das etapas do cadastro. Passo 1: link para entrar. Passos 2 e 3: usuário conectado. */
export function CabecalhoCadastro({ conectado }: { conectado: boolean }) {
  const { data: usuario } = useQuery({
    queryKey: ["usuario", "me"],
    queryFn: () => api<UsuarioMe>("auth", "user/me"),
    enabled: conectado,
  });

  return (
    <header className={classes.cabecalho}>
      {conectado ? (
        <Logo />
      ) : (
        <Anchor component={Link} href="/login" underline="never" c="inherit">
          <Logo />
        </Anchor>
      )}
      {conectado ? (
        <Text fz={14} c="dimmed">
          Conectado como{" "}
          <Text component="strong" fz={14} fw={700} c="var(--mantine-color-text)">
            {usuario ? `@${usuario.userName}` : "…"}
          </Text>
        </Text>
      ) : (
        <Text fz={14} c="dimmed">
          Já tem conta?{" "}
          <Anchor component={Link} href="/login" fz={14} fw={600} c="var(--mantine-color-text)" underline="always">
            Entrar
          </Anchor>
        </Text>
      )}
    </header>
  );
}
