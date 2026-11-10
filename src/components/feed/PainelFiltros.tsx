"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Anchor,
  Badge,
  Button,
  Checkbox,
  Divider,
  Group,
  MultiSelect,
  NumberInput,
  Popover,
  Slider,
  Stack,
  Text,
  UnstyledButton,
  type ComboboxItem,
  type OptionsFilter,
} from "@mantine/core";
import { IconAdjustmentsHorizontal, IconInfoCircle } from "@tabler/icons-react";
import type { CodigoSetor } from "@/lib/api/tipos";
import { FILTROS_PADRAO, MARCAS_KM, RAIO_MAX, contarFiltros, type FiltrosFeed } from "@/lib/filtros-feed";
import { semAcento } from "@/lib/validacao/busca";
import { useSetores } from "@/hooks/useSetores";

/** Busca de setor sem acento e sem diferenciar maiúsculas. */
const filtroSemAcento: OptionsFilter = ({ options, search }) => {
  const q = semAcento(search.trim());
  return (options as ComboboxItem[]).filter((o) => semAcento(o.label).includes(q));
};

interface Props {
  filtros: FiltrosFeed;
  onAplicar: (f: FiltrosFeed) => void;
}

const indiceDaMarca = (raio: number | null) => {
  if (raio === null) return 3;
  let i = 0;
  MARCAS_KM.forEach((m, j) => {
    if (m <= raio) i = j;
  });
  return i;
};

/** Botão "Filtros" + Popover (Distância em todas as abas; Setor só na aba Startups). */
export function PainelFiltros({ filtros, onAplicar }: Props) {
  const [aberto, setAberto] = useState(false);
  const [rascunho, setRascunho] = useState<FiltrosFeed>(filtros);
  const setores = useSetores();
  const contagem = contarFiltros(filtros);
  const startups = filtros.tipo === "startup";
  const qualquer = rascunho.raio === null;

  const abrir = () => {
    setRascunho(filtros);
    setAberto(true);
  };

  const aplicar = () => {
    onAplicar({ ...filtros, raio: rascunho.raio, setores: startups ? rascunho.setores : filtros.setores });
    setAberto(false);
  };

  const n = rascunho.setores.length;
  const rotuloSelecionados = n === 0 ? "Nenhum selecionado" : n === 1 ? "1 selecionado" : `${n} selecionados`;

  return (
    <Popover opened={aberto} onChange={setAberto} position="bottom-end" width={380} shadow="md" radius={10} trapFocus>
      <Popover.Target>
        <Button
          variant="default"
          h={36}
          mb={6}
          onClick={() => (aberto ? setAberto(false) : abrir())}
          aria-expanded={aberto}
          leftSection={<IconAdjustmentsHorizontal size={18} stroke={1.75} />}
          rightSection={
            contagem > 0 ? (
              <Badge size="sm" circle color="dark" aria-label={`${contagem} filtros ativos`}>
                {contagem}
              </Badge>
            ) : null
          }
          styles={{
            root: aberto
              ? { background: "var(--app-soft)", borderColor: "var(--mantine-primary-color-filled)" }
              : undefined,
          }}
        >
          Filtros
        </Button>
      </Popover.Target>
      <Popover.Dropdown p={20} aria-label="Filtros do feed">
        <Stack gap={20}>
          <Stack gap={14}>
            <Group justify="space-between" align="baseline" gap={12} wrap="nowrap">
              <Stack gap={2}>
                <Text fz={14} fw={700}>
                  Distância
                </Text>
                <Text fz={12} c="dimmed">
                  a partir da sua localização
                </Text>
              </Stack>
              <Checkbox
                label="Qualquer distância"
                size="sm"
                checked={qualquer}
                onChange={(e) => {
                  const marcado = e.currentTarget.checked;
                  setRascunho((r) => ({ ...r, raio: marcado ? null : 100 }));
                }}
              />
            </Group>

            <div style={{ padding: "10px 10px 0", opacity: qualquer ? 0.4 : 1 }}>
              <Slider
                min={0}
                max={MARCAS_KM.length - 1}
                step={1}
                value={indiceDaMarca(rascunho.raio)}
                onChange={(i) => setRascunho((r) => ({ ...r, raio: MARCAS_KM[i] }))}
                marks={MARCAS_KM.map((km, i) => ({ value: i, label: `${km} km` }))}
                label={(i) => `${MARCAS_KM[i]} km`}
                disabled={qualquer}
                restrictToMarks
                aria-label="Raio de distância"
                mb={24}
                styles={{ markLabel: { fontSize: 11 } }}
              />
            </div>

            <Group gap={10} wrap="nowrap">
              <Text component="label" htmlFor="filtro-raio" fz={13} c="dimmed" style={{ whiteSpace: "nowrap" }}>
                Raio exato
              </Text>
              <NumberInput
                id="filtro-raio"
                flex={1}
                size="sm"
                h={34}
                placeholder="Qualquer"
                inputMode="numeric"
                thousandSeparator="."
                decimalSeparator=","
                rightSection={<Text fz={13} c="dimmed">km</Text>}
                rightSectionWidth={40}
                allowDecimal={false}
                allowNegative={false}
                hideControls
                min={1}
                max={RAIO_MAX}
                clampBehavior="strict"
                value={rascunho.raio ?? ""}
                onChange={(v) => {
                  const km = typeof v === "number" ? v : Number(v);
                  setRascunho((r) => ({ ...r, raio: Number.isInteger(km) && km > 0 ? km : null }));
                }}
              />
            </Group>
            <Anchor component={Link} href="/configuracoes#cfg-local" fz={12} c="dimmed" underline="always">
              Sua localização está desatualizada? Atualize em Configurações.
            </Anchor>
          </Stack>

          <Divider />

          {startups ? (
            <Stack gap={8}>
              <MultiSelect
                label="Setor"
                description={rotuloSelecionados}
                inputWrapperOrder={["label", "input", "description"]}
                placeholder={n === 0 ? "Buscar setor…" : undefined}
                data={setores.map((s) => ({ value: s.codigo, label: s.rotulo }))}
                value={rascunho.setores}
                onChange={(v) => setRascunho((r) => ({ ...r, setores: v as CodigoSetor[] }))}
                searchable
                filter={filtroSemAcento}
                nothingFoundMessage="Nenhum setor encontrado"
                checkIconPosition="left"
                maxDropdownHeight={180}
                clearable
                comboboxProps={{ withinPortal: false }}
                styles={{ label: { fontWeight: 700, width: "100%" } }}
              />
            </Stack>
          ) : (
            <UnstyledButton
              onClick={() => {
                onAplicar({ ...filtros, tipo: "startup" });
                setRascunho((r) => ({ ...r, setores: filtros.setores }));
              }}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, alignSelf: "flex-start" }}
            >
              <IconInfoCircle size={16} stroke={1.75} color="var(--mantine-color-dimmed)" />
              <Text fz={13} c="dimmed">
                Filtro por setor disponível na aba{" "}
                <Text component="span" fz={13} fw={600} td="underline" c="var(--mantine-color-text)">
                  Startups
                </Text>
                .
              </Text>
            </UnstyledButton>
          )}

          <Group justify="space-between" gap={8} pt={4}>
            <Button
              variant="subtle"
              color="gray"
              c="var(--mantine-color-text)"
              onClick={() => setRascunho({ ...rascunho, raio: FILTROS_PADRAO.raio, setores: [] })}
            >
              Limpar
            </Button>
            <Button onClick={aplicar}>Aplicar filtros</Button>
          </Group>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
