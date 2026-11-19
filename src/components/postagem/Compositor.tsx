"use client";

import { useCallback, useState } from "react";
import { Alert, Button, FileButton, Group, Stack, Text, Textarea, Tooltip } from "@mantine/core";
import { IconBan, IconPhotoPlus } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import type { MeuPerfil } from "@/lib/api/tipos";
import { api } from "@/lib/api/cliente";
import { IMAGEM_MIME, MAX_MIDIAS, VIDEO_MIME } from "@/lib/validacao/arquivos";
import { LIMITE_DESCRICAO, validarDescricao } from "@/lib/validacao/postagem";
import { useMidiasUpload } from "@/hooks/useMidiasUpload";
import { MSG_UPLOAD_DESABILITADO, useUploadHabilitado } from "@/hooks/useUpload";
import { chaves } from "@/hooks/dados";
import { notificarErro, notificarSucesso } from "@/lib/notificar";
import { ErroApi } from "@/lib/api/erros";
import { AvatarPerfil } from "@/components/comum/AvatarPerfil";
import { AjustarMidiaModal } from "./AjustarMidiaModal";
import { MiniaturasOrdenaveis } from "./MiniaturasOrdenaveis";
import classes from "./postagem.module.css";

const ACCEPT = [...IMAGEM_MIME, ...VIDEO_MIME].join(",");

interface Props {
  perfil: MeuPerfil;
  onPublicado?: () => void;
  autoFocus?: boolean;
  /** No modal, o compositor não tem a moldura de card. */
  semMoldura?: boolean;
}

/** Compositor (POST /postagem {descricao ≤ 500, midias[] ≤ 10}). Qualquer tipo de perfil posta. */
export function Compositor({ perfil, onPublicado, autoFocus, semMoldura }: Props) {
  const qc = useQueryClient();
  const [descricao, setDescricao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [publicando, setPublicando] = useState(false);
  const uploadHabilitado = useUploadHabilitado();
  const rejeitar = useCallback((m: string) => notificarErro(new ErroApi(400, m)), []);
  const midias = useMidiasUpload(rejeitar);
  const [ajustando, setAjustando] = useState<string | null>(null);
  const emAjuste = midias.itens.find((m) => m.chave === ajustando);

  const ativo = perfil.ativo;
  const n = midias.itens.length;
  const vazio = !descricao.trim();
  const podePublicar = ativo && !vazio && !midias.enviando && !midias.comErro && !publicando;

  const publicar = async () => {
    const invalido = validarDescricao(descricao);
    setErro(invalido);
    if (invalido || !podePublicar) return;
    setPublicando(true);
    try {
      await api("command", "postagem", {
        metodo: "POST",
        corpo: { descricao: descricao.trim(), midias: midias.prontas.length > 0 ? midias.prontas : null },
      });
      notificarSucesso("Postagem cadastrada com sucesso.");
      setDescricao("");
      setErro(null);
      midias.limpar();
      qc.invalidateQueries({ queryKey: chaves.postagens });
      onPublicado?.();
    } catch (e) {
      if (e instanceof ErroApi && e.campos.descricao) setErro(e.campos.descricao);
      else notificarErro(e);
    } finally {
      setPublicando(false);
    }
  };

  const placeholder =
    perfil.tipo === "STARTUP" ? "Compartilhe uma novidade da sua startup…" : "Compartilhe uma novidade com o mercado…";

  const botaoMidia = (
    <FileButton
      multiple
      accept={ACCEPT}
      onChange={(arquivos) => midias.adicionar(arquivos, n)}
      disabled={!ativo || uploadHabilitado === false || n >= MAX_MIDIAS}
    >
      {(props) => (
        <Button
          {...props}
          variant="light"
          color="gray"
          size="sm"
          h={34}
          leftSection={<IconPhotoPlus size={18} stroke={1.75} />}
          styles={{ root: { background: "var(--app-soft)", color: "var(--mantine-color-text)" } }}
        >
          Foto ou vídeo
        </Button>
      )}
    </FileButton>
  );

  return (
    <section aria-label="Nova postagem" className={semMoldura ? undefined : classes.compositor} style={semMoldura ? { display: "flex", flexDirection: "column", gap: 12 } : undefined}>
      {!ativo && (
        <Alert variant="light" color="red" icon={<IconBan size={18} />} p="xs">
          <Text fz={13}>Seu perfil está desativado. Reative-o para publicar.</Text>
        </Alert>
      )}
      <Group gap={12} align="flex-start" wrap="nowrap">
        <AvatarPerfil nome={perfil.nome} tipo={perfil.tipo} src={perfil.imagemPerfilUrl} tamanho={42} />
        <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
          <Textarea
            aria-label="Descrição da postagem"
            placeholder={placeholder}
            maxLength={LIMITE_DESCRICAO}
            autosize
            minRows={3}
            maxRows={10}
            fz={15}
            value={descricao}
            onChange={(e) => {
              setDescricao(e.currentTarget.value);
              if (erro) setErro(validarDescricao(e.currentTarget.value));
            }}
            error={erro}
            disabled={!ativo}
            autoFocus={autoFocus}
            styles={{ input: { fontSize: 15, lineHeight: 1.5 } }}
          />
        </Stack>
      </Group>

      {n > 0 && (
        <Stack gap={6} style={{ marginLeft: semMoldura ? 0 : 54 }}>
          <MiniaturasOrdenaveis
            itens={midias.itens}
            onReordenar={midias.reordenar}
            onRemover={midias.remover}
            onAjustar={setAjustando}
          />
          {n > 1 && (
            <Text fz={12} c="dimmed">
              Arraste para mudar a ordem. A 1ª mídia abre o carrossel.
            </Text>
          )}
        </Stack>
      )}
      <AjustarMidiaModal
        aberto={emAjuste !== undefined}
        src={emAjuste?.original ?? null}
        onCancelar={() => setAjustando(null)}
        onAplicar={(recorte) => {
          if (emAjuste) midias.substituir(emAjuste.chave, recorte);
          setAjustando(null);
        }}
      />

      <div className={classes.compositorRodape} style={semMoldura ? { paddingLeft: 0 } : undefined}>
        <Group gap={12} wrap="wrap" style={{ flex: "1 1 280px", minWidth: 0 }}>
          {uploadHabilitado === false ? (
            <Tooltip label={MSG_UPLOAD_DESABILITADO}>
              <span>{botaoMidia}</span>
            </Tooltip>
          ) : (
            botaoMidia
          )}
          <Stack gap={2}>
            <Text fz={12} c={descricao.length > LIMITE_DESCRICAO ? "var(--app-err)" : "dimmed"}>
              {n} de {MAX_MIDIAS} mídias · {descricao.length} / {LIMITE_DESCRICAO}
            </Text>
            <Text fz={11} c="dimmed">
              Fotos PNG/JPG até 10 MB · vídeos MP4/MOV até 50 MB
            </Text>
          </Stack>
        </Group>
        <Button onClick={publicar} disabled={!podePublicar} loading={publicando} h={36}>
          Publicar
        </Button>
      </div>
      {midias.enviando && (
        <Text fz={12} c="dimmed" ta="right" mt={-6}>
          Aguarde o envio das mídias terminar para publicar.
        </Text>
      )}
    </section>
  );
}
