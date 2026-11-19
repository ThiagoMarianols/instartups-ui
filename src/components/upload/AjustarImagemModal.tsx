"use client";

import { useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { ActionIcon, Button, Divider, Group, Modal, Slider, Text } from "@mantine/core";
import { IconRotateClockwise, IconZoomIn, IconZoomOut } from "@tabler/icons-react";
import { recortarImagem } from "@/lib/imagem/recortar";
import classes from "./upload.module.css";

export type FormaImagem = "foto" | "capa";

interface Props {
  aberto: boolean;
  forma: FormaImagem;
  src: string | null;
  onCancelar: () => void;
  onAplicar: (recorte: Blob) => void;
}

/** Modal "Ajustar imagem" (artboard 15): foto redonda 1:1, capa retangular 4:1, zoom 1–3 e girar 90°. */
export function AjustarImagemModal({ aberto, forma, src, onCancelar, onAplicar }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.4);
  const [rotacao, setRotacao] = useState(0);
  const [area, setArea] = useState<Area | null>(null);
  const [gerando, setGerando] = useState(false);
  const capa = forma === "capa";

  const limitar = (v: number) => Math.max(1, Math.min(3, Math.round(v * 10) / 10));

  const aplicar = async () => {
    if (!src || !area) return;
    setGerando(true);
    try {
      onAplicar(await recortarImagem(src, area, rotacao, capa ? 2000 : 800));
    } finally {
      setGerando(false);
    }
  };

  return (
    <Modal
      opened={aberto}
      onClose={onCancelar}
      size={560}
      padding={0}
      title={
        <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span>{capa ? "Ajustar imagem de capa" : "Ajustar foto de perfil"}</span>
          <Text component="span" fz={13} fw={400} c="dimmed">
            Arraste para reposicionar e use o zoom para enquadrar.
          </Text>
        </span>
      }
      closeButtonProps={{ "aria-label": "Fechar" }}
      classNames={{ header: classes.modalCabecalho }}
      onExitTransitionEnd={() => {
        setZoom(1.4);
        setRotacao(0);
        setCrop({ x: 0, y: 0 });
      }}
    >
      <div className={classes.areaRecorte}>
        {src && (
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            rotation={rotacao}
            aspect={capa ? 4 : 1}
            cropShape={capa ? "rect" : "round"}
            minZoom={1}
            maxZoom={3}
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={(z) => setZoom(limitar(z))}
            onCropComplete={(_, px) => setArea(px)}
          />
        )}
      </div>

      <Group gap={12} px={24} py={18} wrap="nowrap">
        <ActionIcon variant="subtle" color="gray" aria-label="Diminuir zoom" onClick={() => setZoom((z) => limitar(z - 0.2))}>
          <IconZoomOut size={18} />
        </ActionIcon>
        <Slider
          flex={1}
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={setZoom}
          label={null}
          aria-label="Zoom"
        />
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
          {capa ? "A capa usa proporção 4:1." : "A foto aparece em círculo no perfil e no feed."}
        </Text>
        <Group gap={8}>
          <Button variant="default" onClick={onCancelar} disabled={gerando}>
            Cancelar
          </Button>
          <Button onClick={aplicar} loading={gerando} disabled={!area}>
            Aplicar e enviar
          </Button>
        </Group>
      </Group>
    </Modal>
  );
}
