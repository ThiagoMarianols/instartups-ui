"use client";

import { Divider, Group, Input, NumberInput, Select, Stack, Text, Textarea, TextInput, Title } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import type { UseFormReturnType } from "@mantine/form";
import { IconCalendar } from "@tabler/icons-react";
import { brParaIso, hojeIso, mascararDataBr } from "@/lib/formato/data";
import { LIMITES_PERFIL } from "@/lib/validacao/perfil";
import type { TipoCadastro, ValoresPerfil } from "@/lib/validacao/perfil-form";
import { useSetores } from "@/hooks/useSetores";
import { MapaLocal } from "@/components/mapa/MapaLocal";
import { CapaUpload, FotoUpload } from "@/components/upload/ImagensPerfil";

interface Props {
  form: UseFormReturnType<ValoresPerfil>;
  tipo: TipoCadastro;
  onEnviandoChange?: (chave: "foto" | "capa", enviando: boolean) => void;
  desabilitado?: boolean;
}

function Secao({ titulo, descricao, obrigatoria, children }: { titulo: string; descricao: string; obrigatoria?: boolean; children: React.ReactNode }) {
  return (
    <Stack component="section" gap={16}>
      <Stack gap={2}>
        <Title order={3} fz={18}>
          {titulo}
          {obrigatoria && (
            <Text component="span" c="var(--app-err)" fz={18} fw={700} ml={4} aria-hidden>
              *
            </Text>
          )}
        </Title>
        <Text fz={13} c="dimmed">
          {descricao}
        </Text>
      </Stack>
      {children}
    </Stack>
  );
}

/** Ajuda (cinza) quando não há erro; o erro substitui a ajuda, como no canvas. */
const ajuda = (form: UseFormReturnType<ValoresPerfil>, campo: string, texto: string) =>
  form.errors[campo] ? undefined : texto;

const ORDEM = ["label", "input", "description", "error"] as ("label" | "input" | "description" | "error")[];

function Contador({ valor, max }: { valor: string; max: number }) {
  const n = valor.length;
  return (
    <Text fz={12} c={n > max ? "var(--app-err)" : "dimmed"} style={{ whiteSpace: "nowrap" }}>
      {n} / {max}
    </Text>
  );
}

const dinheiro = {
  leftSection: <Text fz={14} c="dimmed">R$</Text>,
  leftSectionWidth: 38,
  placeholder: "0,00",
  inputMode: "decimal" as const,
  decimalSeparator: ",",
  thousandSeparator: ".",
  decimalScale: 2,
  fixedDecimalScale: true,
  allowNegative: false,
  max: LIMITES_PERFIL.valorMax,
  clampBehavior: "strict" as const,
  hideControls: true,
};

/** Formulário de perfil (artboard "Componente · Formulário de perfil"). */
export function PerfilForm({ form, tipo, onEnviandoChange, desabilitado }: Props) {
  const setores = useSetores();
  const startup = tipo === "startup";
  const erroMapa = form.errors["perfil.coordenada"];

  return (
    <Stack gap={28}>
      <Secao titulo="Identidade" descricao="Como o perfil aparece no feed e na página de perfil.">
        <div>
          <CapaUpload
            valor={form.values.perfil.imagemFundoUrl}
            onChange={(url) => form.setFieldValue("perfil.imagemFundoUrl", url)}
            onEnviandoChange={(e) => onEnviandoChange?.("capa", e)}
            desabilitado={desabilitado}
          />
          <FotoUpload
            valor={form.values.perfil.imagemPerfilUrl}
            onChange={(url) => form.setFieldValue("perfil.imagemPerfilUrl", url)}
            onEnviandoChange={(e) => onEnviandoChange?.("foto", e)}
            desabilitado={desabilitado}
          />
        </div>

        <TextInput
          label="Nome"
          withAsterisk
          placeholder={startup ? "Nome da startup" : "Seu nome ou do fundo"}
          maxLength={LIMITES_PERFIL.nome}
          inputWrapperOrder={ORDEM}
          description={ajuda(form, "perfil.nome", `Até ${LIMITES_PERFIL.nome} caracteres.`)}
          disabled={desabilitado}
          {...form.getInputProps("perfil.nome")}
        />
      </Secao>

      <Divider />

      <Secao
        titulo="Localização"
        obrigatoria
        descricao={`Marque no mapa onde fica sua ${startup ? "startup" : "base de atuação"}. É usada para filtrar perfis por distância.`}
      >
        <Input.Wrapper label="Localização" labelProps={{ className: "sr-only" }}>
          <MapaLocal
            valor={form.values.perfil.coordenada}
            onChange={(c) => {
              form.setFieldValue("perfil.coordenada", c);
              if (c) form.clearFieldError("perfil.coordenada");
            }}
            erro={erroMapa}
            altura={240}
            desabilitado={desabilitado}
          />
        </Input.Wrapper>
      </Secao>

      <Divider />

      {startup ? (
        <Secao titulo="Sobre a startup" descricao="Todos os campos são obrigatórios.">
          <Group grow align="flex-start" gap={16} wrap="wrap" style={{ rowGap: 16 }}>
            <Select
              label="Setor"
              withAsterisk
              placeholder="Selecione"
              data={setores.map((s) => ({ value: s.codigo, label: s.rotulo }))}
              searchable
              nothingFoundMessage="Nenhum setor encontrado"
              checkIconPosition="right"
              allowDeselect={false}
              comboboxProps={{ withinPortal: true }}
              inputWrapperOrder={ORDEM}
              description={ajuda(form, "setor", `${setores.map((s) => s.rotulo).join(", ").replace(/, ([^,]*)$/, " ou $1")}.`)}
              miw={240}
              disabled={desabilitado}
              {...form.getInputProps("setor")}
            />
            <DateInput
              label="Data de fundação"
              withAsterisk
              placeholder="dd/mm/aaaa"
              valueFormat="DD/MM/YYYY"
              dateParser={brParaIso}
              maxDate={hojeIso()}
              inputMode="numeric"
              maxLength={10}
              leftSection={<IconCalendar size={16} stroke={1.75} />}
              inputWrapperOrder={ORDEM}
              description={ajuda(form, "dataFundacao", "Datas futuras ficam bloqueadas no calendário.")}
              miw={240}
              clearable={false}
              allowDeselect
              disabled={desabilitado}
              popoverProps={{ withinPortal: true }}
              {...form.getInputProps("dataFundacao")}
              onChangeCapture={(e) => {
                const alvo = e.target as HTMLInputElement;
                const mascarado = mascararDataBr(alvo.value);
                alvo.value = mascarado;
                const iso = brParaIso(mascarado);
                if (iso && iso > hojeIso()) {
                  form.setFieldValue("dataFundacao", iso);
                } else if (!iso && form.values.dataFundacao !== null) {
                  form.setFieldValue("dataFundacao", null);
                }
              }}
            />
          </Group>
          <Group grow align="flex-start" gap={16} wrap="wrap" style={{ rowGap: 16 }}>
            <NumberInput
              label="Tamanho da equipe"
              withAsterisk
              placeholder="Nº de pessoas"
              inputMode="numeric"
              thousandSeparator="."
              decimalSeparator=","
              allowDecimal={false}
              allowNegative={false}
              min={LIMITES_PERFIL.equipeMin}
              max={LIMITES_PERFIL.equipeMax}
              clampBehavior="strict"
              hideControls
              inputWrapperOrder={ORDEM}
              description={ajuda(form, "tamanhoEquipe", "Entre 1 e 32.767.")}
              miw={240}
              disabled={desabilitado}
              {...form.getInputProps("tamanhoEquipe")}
            />
            <NumberInput
              label="Valor buscado"
              withAsterisk
              {...dinheiro}
              inputWrapperOrder={ORDEM}
              description={ajuda(form, "valorBuscado", "Maior que zero, até 2 casas decimais.")}
              miw={240}
              disabled={desabilitado}
              {...form.getInputProps("valorBuscado")}
            />
          </Group>
          <Stack gap={4}>
            <Textarea
              label="Pitch"
              withAsterisk
              placeholder="Em poucas linhas: o problema, a solução e por que agora."
              maxLength={LIMITES_PERFIL.texto}
              autosize
              minRows={5}
              maxRows={12}
              disabled={desabilitado}
              {...form.getInputProps("pitch")}
              error={Boolean(form.errors.pitch)}
            />
            <Group justify="space-between" gap={12} wrap="nowrap">
              <Text fz={12} c={form.errors.pitch ? "var(--app-err)" : "dimmed"}>
                {form.errors.pitch ?? "Aparece no topo do seu perfil."}
              </Text>
              <Contador valor={form.values.pitch} max={LIMITES_PERFIL.texto} />
            </Group>
          </Stack>
        </Secao>
      ) : (
        <Secao titulo="Sobre o investidor" descricao="Todos os campos são obrigatórios.">
          <Stack gap={4}>
            <Textarea
              label="Tese de investimento"
              withAsterisk
              placeholder="Em que tipo de startup você investe e o que procura."
              maxLength={LIMITES_PERFIL.texto}
              autosize
              minRows={6}
              maxRows={12}
              disabled={desabilitado}
              {...form.getInputProps("teseInvestimento")}
              error={Boolean(form.errors.teseInvestimento)}
            />
            <Group justify="space-between" gap={12} wrap="nowrap">
              <Text fz={12} c={form.errors.teseInvestimento ? "var(--app-err)" : "dimmed"}>
                {form.errors.teseInvestimento ?? "Aparece no topo do seu perfil."}
              </Text>
              <Contador valor={form.values.teseInvestimento} max={LIMITES_PERFIL.texto} />
            </Group>
          </Stack>
          <Group grow align="flex-start" gap={16} wrap="wrap" style={{ rowGap: 16 }}>
            <NumberInput
              label="Ticket mínimo"
              withAsterisk
              {...dinheiro}
              inputWrapperOrder={ORDEM}
              description={ajuda(form, "ticketMinimo", "Maior que zero.")}
              miw={240}
              disabled={desabilitado}
              {...form.getInputProps("ticketMinimo")}
            />
            <NumberInput
              label="Ticket máximo"
              withAsterisk
              {...dinheiro}
              inputWrapperOrder={ORDEM}
              description={ajuda(form, "ticketMaximo", "Precisa ser maior que o ticket mínimo.")}
              miw={240}
              disabled={desabilitado}
              {...form.getInputProps("ticketMaximo")}
            />
          </Group>
        </Secao>
      )}
    </Stack>
  );
}
