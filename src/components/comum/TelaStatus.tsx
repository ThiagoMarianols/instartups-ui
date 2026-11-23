"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Button, Group, Text, Title } from "@mantine/core";
import { Logo } from "@/components/Logo";
import classes from "./status.module.css";

interface LinkStatus {
  href: string;
  rotulo: string;
  variante?: "filled" | "default";
}

interface Props {
  icone: ReactNode;
  codigo?: string;
  titulo: string;
  texto: string;
  links?: LinkStatus[];
  onTentarNovamente?: () => void;
}

/** Página centralizada de erro ou página não encontrada, alinhada ao tema do app. */
export function TelaStatus({ icone, codigo, titulo, texto, links = [], onTentarNovamente }: Props) {
  return (
    <div className={classes.pagina}>
      <Link href="/feed" className={classes.marca}>
        <Logo tamanho="md" />
      </Link>
      <main className={classes.cartao}>
        <span className={classes.icone} aria-hidden="true">
          {icone}
        </span>
        {codigo && <span className={classes.codigo}>{codigo}</span>}
        <Title order={1} fz={22}>
          {titulo}
        </Title>
        <Text fz={14} lh={1.55} c="dimmed" maw={360}>
          {texto}
        </Text>
        {(onTentarNovamente || links.length > 0) && (
          <Group justify="center" gap={10} mt={6} wrap="wrap">
            {onTentarNovamente && (
              <Button onClick={onTentarNovamente} h={38}>
                Tentar novamente
              </Button>
            )}
            {links.map((item) => (
              <Button
                key={item.href}
                component={Link}
                href={item.href}
                variant={item.variante ?? "default"}
                h={38}
              >
                {item.rotulo}
              </Button>
            ))}
          </Group>
        )}
      </main>
    </div>
  );
}
