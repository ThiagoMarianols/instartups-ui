"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Group, Radio, Stack, Text, Title } from "@mantine/core";
import { IconArrowRight, IconBriefcase, IconLock, IconRocket } from "@tabler/icons-react";
import classes from "./tipo.module.css";

type Tipo = "startup" | "investidor";

const OPCOES: { valor: Tipo; titulo: string; texto: string; campos: string; Icone: typeof IconRocket }[] = [
  {
    valor: "startup",
    titulo: "Sou uma startup",
    texto: "Apresente seu negócio e mostre quanto está captando.",
    campos: "Você vai informar: pitch, setor, data de fundação, tamanho da equipe e valor buscado.",
    Icone: IconRocket,
  },
  {
    valor: "investidor",
    titulo: "Sou investidor",
    texto: "Mostre sua tese e a faixa de valores em que investe.",
    campos: "Você vai informar: tese de investimento, ticket mínimo e ticket máximo.",
    Icone: IconBriefcase,
  },
];

export function EscolhaTipo() {
  const [tipo, setTipo] = useState<Tipo>("startup");

  return (
    <Stack w="100%" maw={720} gap={24}>
      <Stack gap={6} ta="center">
        <Title order={1} fz={28} style={{ letterSpacing: "-0.01em" }}>
          Como você vai usar o InStartups?
        </Title>
        <Text fz={15} c="dimmed">
          Cada conta tem um único perfil.
        </Text>
      </Stack>

      <Radio.Group value={tipo} onChange={(v) => setTipo(v as Tipo)} aria-label="Tipo de perfil">
        <div className={classes.opcoes}>
          {OPCOES.map(({ valor, titulo, texto, campos, Icone }) => (
            <Radio.Card key={valor} value={valor} className={classes.cartao} radius={12}>
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <span className={classes.icone} data-ativo={tipo === valor || undefined}>
                  <Icone size={24} stroke={1.75} aria-hidden />
                </span>
                <Radio.Indicator />
              </Group>
              <Text fz={20} fw={700} mt={14}>
                {titulo}
              </Text>
              <Text fz={14} lh={1.55} c="dimmed" mt={14}>
                {texto}
              </Text>
              <Text fz={13} lh={1.6} className={classes.campos}>
                {campos}
              </Text>
            </Radio.Card>
          ))}
        </div>
      </Radio.Group>

      <div role="note" className={classes.nota}>
        <IconLock size={18} stroke={2} aria-hidden style={{ flex: "none" }} />
        <Text fz={14}>O tipo do perfil não poderá ser alterado depois.</Text>
      </div>

      <Group justify="flex-end">
        <Button
          component={Link}
          href={`/cadastro/perfil?tipo=${tipo}`}
          h={44}
          size="md"
          rightSection={<IconArrowRight size={18} stroke={2} />}
        >
          {tipo === "startup" ? "Continuar como startup" : "Continuar como investidor"}
        </Button>
      </Group>
    </Stack>
  );
}
