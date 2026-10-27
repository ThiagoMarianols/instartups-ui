"use client";

import { useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { ActionIcon, Button, Divider, Group, Modal, SegmentedControl, Slider, Text } from "@mantine/core";
import { IconRotateClockwise, IconZoomIn, IconZoomOut } from "@tabler/icons-react";
import { recortarImagem } from "@/lib/imagem/recortar";
import classes from "@/components/upload/upload.module.css";

type Proporcao = "original" | "1:1" | "4:5" | "16:9";

const PROPORCOES: Record<Exclude<Proporcao, "original">, number> = { "1:1": 1, "4:5": 4 / 5, "16:9": 16 / 9 };

interface Props {
  aberto: boolean;
  /** Foto como foi escolhida (o ajuste sempre parte do original). */
  src: string | null;
  onCancelar: () => void;
  onAplicar: (recorte: Blob) => void;
}

/** Ajuste de foto da postagem: proporção, zoom 1–3 e girar 90°. */
export function AjustarMidiaModal({ aberto, src, onCancelar, onAplicar }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotacao, setRotacao] = useState(0);
  const [proporcao, setProporcao] = useState<Proporcao>("original");
  const [natural, setNatural] = useState<number | null>(null);
  const [area, setArea] = useState<Area | null>(null);
  const [gerando, setGerando] = useState(false);

  const limitar = (v: number) => Math.max(1, Math.min(3, Math.round(v * 10) / 10));
  const deitada = rotacao % 180 !== 0;
  const original = natural ? (deitada ? 1 / natural : natural) : 1;
  const aspect = proporcao === "original" ? original : PROPORCOES[proporcao];

  const aplicar = async () => {
    if (!src || !area) return;
    setGerando(true);
    try {
      onAplicar(await recortarImagem(src, area, rotacao, 1440));
    } finally {
      setGerando(false);
    }
  };

  return (
    <Modal
      opened={aberto}
      onClose={onCancelar}
      size={620}
      padding={0}
      title={
        <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span>Ajustar foto</span>
          <Text component="span" fz={13} fw={400} c="dimmed">
            Arraste para reposicionar e use o zoom para enquadrar.
          </Text>
        </span>
      }
      closeButtonProps={{ "aria-label": "Fechar" }}
      classNames={{ header: classes.modalCabecalho }}
      onExitTransitionEnd={() => {
        setZoom(1);
        setRotacao(0);
        setCrop({ x: 0, y: 0 });
        setProporcao("original");
        setNatural(null);
        setArea(null);
      }}
    >
      <div className={classes.areaRecorte} style={{ height: 400 }}>
        {src && (
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            rotation={rotacao}
            aspect={aspect}
            cropShape="rect"
            minZoom={1}
            maxZoom={3}
            showGrid
            onCropChange={setCrop}
            onZoomChange={(z) => setZoom(limitar(z))}
            onCropComplete={(_, px) => setArea(px)}
            onMediaLoaded={(m) => setNatural(m.naturalWidth / m.naturalHeight)}
          />
        )}
      </div>

      <Group px={24} pt={16} justify="center">
        <SegmentedControl
          size="xs"
          value={proporcao}
          onChange={(v) => setProporcao(v as Proporcao)}
          aria-label="Proporção"
          data={[
            { value: "original", label: "Original" },
            { value: "1:1", label: "1:1" },
            { value: "4:5", label: "4:5" },
            { value: "16:9", label: "16:9" },
          ]}
        />
      </Group>

      <Group gap={12} px={24} py={16} wrap="nowrap">
        <ActionIcon variant="subtle" color="gray" aria-label="Diminuir zoom" onClick={() => setZoom((z) => limitar(z - 0.2))}>
          <IconZoomOut size={18} />
        </ActionIcon>
        <Slider flex={1} min={1} max={3} step={0.1} value={zoom} onChange={setZoom} label={null} aria-label="Zoom" />
        <ActionIcon variant="subtle" color="gray" aria-label="Aumentar zoom" onClick={() => setZoom((z) => limitar(z + 0.2))}>
          <IconZoomIn size={18} />
        </ActionIcon>
        <Divider orientation="vertical" />
        <Button
          variant="default"
          size="xs"
          h={32}
          leftSection={<IconRotateClockwise size={16} />}
          onClick={() => setRotacao((r) => (r + 90) % 360)}
        >
          Girar
        </Button>
      </Group>
      <Divider />

      <Group justify="space-between" px={24} py={16} gap={8}>
        <Text fz={12} c="dimmed">
          A 1ª mídia define a proporção do carrossel no feed.
        </Text>
        <Group gap={8}>
          <Button variant="default" onClick={onCancelar} disabled={gerando}>
            Cancelar
          </Button>
          <Button onClick={aplicar} loading={gerando} disabled={!area}>
            Aplicar
          </Button>
        </Group>
      </Group>
    </Modal>
  );
}
