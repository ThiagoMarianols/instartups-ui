import type { ReactNode } from "react";
import { Text, Title } from "@mantine/core";
import classes from "@/components/feed/feed.module.css";

interface Props {
  icone: ReactNode;
  titulo: string;
  texto?: string;
  acao?: ReactNode;
  /** Borda sólida (estado inicial da busca) em vez de tracejada. */
  solido?: boolean;
}

export function EstadoVazio({ icone, titulo, texto, acao, solido }: Props) {
  return (
    <div className={classes.vazio} data-solido={solido || undefined}>
      <span className={classes.vazioIcone} aria-hidden="true">
        {icone}
      </span>
      <Title order={2} fz={18}>
        {titulo}
      </Title>
      {texto && (
        <Text fz={14} lh={1.55} c="dimmed" maw={380}>
          {texto}
        </Text>
      )}
      {acao}
    </div>
  );
}
