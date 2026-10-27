"use client";

import { useCallback, useState } from "react";
import { Button, Divider, Group, Modal, Stack, Text, Textarea, Tooltip } from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import { IconPlus } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import type { Postagem } from "@/lib/api/tipos";
import { api } from "@/lib/api/cliente";
import { ErroApi } from "@/lib/api/erros";
import { IMAGEM_MIME, MAX_MIDIAS, VIDEO_MAX, VIDEO_MIME } from "@/lib/validacao/arquivos";
import { LIMITE_DESCRICAO, validarDescricao, validarTotalMidias } from "@/lib/validacao/postagem";
import { useMidiasUpload } from "@/hooks/useMidiasUpload";
import { MSG_UPLOAD_DESABILITADO, useUploadHabilitado } from "@/hooks/useUpload";
import { chaves } from "@/hooks/dados";
import { notificarErro, notificarSucesso } from "@/lib/notificar";
import { MiniaturaExistente, MiniaturaNova } from "./Miniaturas";
import classes from "./postagem.module.css";

interface Props {
  postagem: Postagem | null;
  onFechar: () => void;
}

/** PUT /postagem/{id} {descricao, midiasRemovidas[ids], midiasAdicionadas[]}. Só o autor; postagem ativa. */
export function EditarPostagemModal({ postagem, onFechar }: Props) {
  return (
    <Modal opened={Boolean(postagem)} onClose={onFechar} title="Editar postagem" size={620} padding={0} closeButtonProps={{ "aria-label": "Fechar" }} styles={{ header: { padding: "18px 24px", borderBottom: "1px solid var(--mantine-color-default-border)" } }}>
      {postagem && <Conteudo key={postagem.id} postagem={postagem} onFechar={onFechar} />}
    </Modal>
  );
}

function Conteudo({ postagem, onFechar }: { postagem: Postagem; onFechar: () => void }) {
  const qc = useQueryClient();
  const [descricao, setDescricao] = useState(postagem.descricao);
  const [removidas, setRemovidas] = useState<string[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const uploadHabilitado = useUploadHabilitado();
  const rejeitar = useCallback((m: string) => notificarErro(new ErroApi(400, m)), []);
  const novas = useMidiasUpload(rejeitar);


  const total = postagem.midias.length - removidas.length + novas.itens.length;
  const erroTotal = validarTotalMidias(total);
  const mudou =
    descricao !== postagem.descricao || removidas.length > 0 || novas.itens.length > 0;
  const podeSalvar = mudou && !novas.enviando && !novas.comErro && !erroTotal && !salvando;

  const alternar = (id: string) =>
    setRemovidas((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]));

  const salvar = async () => {
    const invalido = validarDescricao(descricao);
    if (invalido) {
      setErro(invalido);
      return;
    }
    if (!podeSalvar) return;
    setSalvando(true);
    try {
      await api("command", `postagem/${postagem.id}`, {
        metodo: "PUT",
        corpo: { descricao: descricao.trim(), midiasRemovidas: removidas, midiasAdicionadas: novas.prontas },
      });
      notificarSucesso("Postagem atualizada.");
      qc.invalidateQueries({ queryKey: chaves.postagens });
      onFechar();
    } catch (e) {
      if (e instanceof ErroApi && e.campos.descricao) setErro(e.campos.descricao);
      else notificarErro(e);
    } finally {
      setSalvando(false);
    }
  };

  const vagas = MAX_MIDIAS - total;
  const adicionar = (
    <Dropzone
      onDrop={(arquivos) => novas.adicionar(arquivos, total)}
      onReject={(r) => r.forEach((f) => rejeitar(`${f.file.name}: formato ou tamanho não suportado.`))}
      accept={[...IMAGEM_MIME, ...VIDEO_MIME]}
      maxSize={VIDEO_MAX}
      disabled={uploadHabilitado === false || vagas <= 0}
      className={classes.adicionar}
      aria-label="Adicionar mídias"
    >
      <Stack align="center" gap={6}>
        <IconPlus size={24} stroke={1.75} />
        <Text fz={13} fw={600} c="var(--mantine-color-text)">
          Adicionar
        </Text>
        <Text fz={11}>PNG/JPG · MP4/MOV</Text>
      </Stack>
    </Dropzone>
  );

  return (
    <>
      <Stack gap={20} p={24}>
        <Stack gap={4}>
          <Textarea
            label="Descrição"
            withAsterisk
            autosize
            minRows={4}
            maxRows={12}
            value={descricao}
            onChange={(e) => {
              setDescricao(e.currentTarget.value);
              if (erro) setErro(validarDescricao(e.currentTarget.value));
            }}
            error={erro}
            styles={{ input: { fontSize: 15, lineHeight: 1.55 } }}
            data-autofocus
          />
          <Text fz={12} c={descricao.length > LIMITE_DESCRICAO ? "var(--app-err)" : "dimmed"} ta="right">
            {descricao.length} / {LIMITE_DESCRICAO}
          </Text>
        </Stack>

        <Stack gap={10}>
          <Group justify="space-between" align="baseline">
            <Text fz={14} fw={500}>
              Mídias
            </Text>
            <Text fz={12} c={erroTotal ? "var(--app-err)" : "dimmed"}>
              {total} de {MAX_MIDIAS} após salvar
            </Text>
          </Group>
          <div className={classes.miniaturas}>
            {postagem.midias.map((m) => (
              <MiniaturaExistente key={m.id} url={m.url} tipo={m.tipo} removida={removidas.includes(m.id)} onAlternar={() => alternar(m.id)} />
            ))}
            {novas.itens.map((m) => (
              <MiniaturaNova
                key={m.chave}
                preview={m.preview}
                tipo={m.tipo}
                progresso={m.progresso}
                pronta={Boolean(m.url)}
                erro={m.erro}
                onRemover={() => novas.remover(m.chave)}
              />
            ))}
            {vagas > 0 &&
              (uploadHabilitado === false ? (
                <Tooltip label={MSG_UPLOAD_DESABILITADO}>
                  <div>{adicionar}</div>
                </Tooltip>
              ) : (
                adicionar
              ))}
          </div>
          <Text fz={12} c="dimmed">
            Arraste arquivos para cá ou clique em Adicionar. Fotos PNG/JPG até 10 MB · vídeos MP4/MOV até 50 MB. As mídias
            marcadas são removidas antes das novas serem adicionadas. Limite de {MAX_MIDIAS} por postagem.
          </Text>
          {erroTotal && (
            <Text fz={12} c="var(--app-err)">
              {erroTotal}
            </Text>
          )}
        </Stack>
      </Stack>
      <Divider />
      <Group justify="space-between" px={24} py={16} gap={8}>
        <Text fz={12} c="dimmed">
          {novas.enviando ? "Aguarde o envio terminar para salvar." : ""}
        </Text>
        <Group gap={8}>
          <Button variant="default" onClick={onFechar}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={!podeSalvar} loading={salvando}>
            Salvar
          </Button>
        </Group>
      </Group>
    </>
  );
}
