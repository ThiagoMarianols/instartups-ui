"use client";

import { useEffect, useRef, useState } from "react";
import { ActionIcon, Button, FileButton, Menu, Progress, Text, Tooltip, UnstyledButton } from "@mantine/core";
import { Dropzone, type FileRejection } from "@mantine/dropzone";
import {
  IconAlertCircle,
  IconCamera,
  IconCrop,
  IconPhotoPlus,
  IconRefresh,
  IconTrash,
} from "@tabler/icons-react";
import { IMAGEM_MAX, IMAGEM_MIME, MSG_ARQUIVO, validarArquivo } from "@/lib/validacao/arquivos";
import { enviarArquivo, MSG_UPLOAD_DESABILITADO, UploadCancelado, useUploadHabilitado } from "@/hooks/useUpload";
import { mensagemDoErro } from "@/lib/api/erros";
import { AjustarImagemModal, type FormaImagem } from "./AjustarImagemModal";
import classes from "./upload.module.css";

interface ImagemProps {
  valor: string | null;
  onChange: (url: string | null) => void;
  /** Avisa o formulário para desabilitar o salvar enquanto envia. */
  onEnviandoChange?: (enviando: boolean) => void;
  desabilitado?: boolean;
}

/** Estado compartilhado: escolher → ajustar (recorte) → enviar ao storage → URL no formulário. */
function useImagem(forma: FormaImagem, { valor, onChange, onEnviandoChange }: ImagemProps) {
  const habilitado = useUploadHabilitado();
  const [original, setOriginal] = useState<string | null>(null); // object URL do arquivo escolhido
  const [preview, setPreview] = useState<string | null>(null); // object URL do recorte
  const [modal, setModal] = useState(false);
  const [progresso, setProgresso] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const controle = useRef<AbortController | null>(null);
  const urls = useRef<string[]>([]);

  useEffect(() => {
    const criadas = urls.current;
    return () => {
      controle.current?.abort();
      criadas.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  const novaUrl = (blob: Blob) => {
    const u = URL.createObjectURL(blob);
    urls.current.push(u);
    return u;
  };

  const escolher = (arquivo: File | null) => {
    if (!arquivo) return;
    const invalido = validarArquivo(forma, arquivo.type, arquivo.size);
    if (invalido) {
      setErro(invalido);
      return;
    }
    setErro(null);
    setOriginal(novaUrl(arquivo));
    setModal(true);
  };

  const rejeitar = (rejeitados: FileRejection[]) => {
    const codigo = rejeitados[0]?.errors[0]?.code;
    setErro(codigo === "file-too-large" ? MSG_ARQUIVO.imagemGrande : MSG_ARQUIVO.formatoImagem);
  };

  const aplicar = async (recorte: Blob) => {
    setModal(false);
    setPreview(novaUrl(recorte));
    setErro(null);
    setProgresso(0);
    onEnviandoChange?.(true);
    controle.current = new AbortController();
    try {
      const url = await enviarArquivo(recorte, forma, setProgresso, controle.current.signal);
      onChange(url);
    } catch (e) {
      setPreview(null);
      if (!(e instanceof UploadCancelado)) setErro(mensagemDoErro(e) || MSG_ARQUIVO.formatoImagem);
    } finally {
      setProgresso(null);
      onEnviandoChange?.(false);
      controle.current = null;
    }
  };

  const remover = () => {
    controle.current?.abort();
    setPreview(null);
    setOriginal(null);
    setErro(null);
    onChange(null); // imagem removida vai como null, nunca ""
  };

  return {
    habilitado,
    exibida: preview ?? valor,
    podeAjustar: Boolean(original),
    enviando: progresso !== null,
    progresso: progresso ?? 0,
    erro,
    escolher,
    rejeitar,
    remover,
    cancelarEnvio: () => controle.current?.abort(),
    ajustar: () => original && setModal(true),
    modal: (
      <AjustarImagemModal
        aberto={modal}
        forma={forma}
        src={original}
        onCancelar={() => setModal(false)}
        onAplicar={aplicar}
      />
    ),
  };
}

const ACCEPT = IMAGEM_MIME as unknown as string[];

function SeDesabilitado({ ativo, children }: { ativo: boolean; children: React.ReactElement }) {
  return ativo ? (
    <Tooltip label={MSG_UPLOAD_DESABILITADO}>
      <span style={{ display: "contents" }}>{children}</span>
    </Tooltip>
  ) : (
    children
  );
}

/** Capa 4:1 (opcional). */
export function CapaUpload(props: ImagemProps) {
  const img = useImagem("capa", props);
  const bloqueado = props.desabilitado || img.habilitado === false;

  return (
    <>
      {img.exibida ? (
        <div className={classes.capa}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.exibida} alt="Imagem de capa" className={classes.capaImg} data-enviando={img.enviando || undefined} />
          {img.enviando ? (
            <div className={classes.progressoCaixa}>
              <div className={classes.progressoTopo}>
                <Text fz={12} fw={600}>
                  Enviando… {img.progresso}%
                </Text>
                <UnstyledButton fz={12} td="underline" onClick={img.cancelarEnvio}>
                  Cancelar
                </UnstyledButton>
              </div>
              <Progress value={img.progresso} size={6} aria-label="Progresso do envio" />
            </div>
          ) : (
            <span className={classes.acoesCapa}>
              {img.podeAjustar && (
                <ActionIcon className={classes.acaoEscura} aria-label="Ajustar enquadramento da capa" onClick={img.ajustar}>
                  <IconCrop size={16} />
                </ActionIcon>
              )}
              <FileButton onChange={img.escolher} accept={ACCEPT.join(",")} disabled={bloqueado}>
                {(p) => (
                  <ActionIcon {...p} className={classes.acaoEscura} aria-label="Trocar imagem de capa" disabled={bloqueado}>
                    <IconRefresh size={16} />
                  </ActionIcon>
                )}
              </FileButton>
              <ActionIcon className={classes.acaoEscura} aria-label="Remover imagem de capa" onClick={img.remover} disabled={props.desabilitado}>
                <IconTrash size={16} />
              </ActionIcon>
            </span>
          )}
        </div>
      ) : img.erro ? (
        <div role="alert" className={classes.capaErro}>
          <IconAlertCircle size={24} stroke={1.75} aria-hidden />
          <Text fz={13} fw={600}>
            {img.erro}
          </Text>
          <FileButton onChange={img.escolher} accept={ACCEPT.join(",")} disabled={bloqueado}>
            {(p) => (
              <Button {...p} variant="default" size="compact-sm">
                Tentar novamente
              </Button>
            )}
          </FileButton>
        </div>
      ) : (
        <SeDesabilitado ativo={img.habilitado === false}>
          <Dropzone
            onDrop={(arquivos) => img.escolher(arquivos[0] ?? null)}
            onReject={img.rejeitar}
            accept={ACCEPT}
            maxSize={IMAGEM_MAX}
            multiple={false}
            disabled={bloqueado}
            className={classes.capaVazia}
            aria-label="Enviar imagem de capa"
          >
            <IconPhotoPlus size={24} stroke={1.5} aria-hidden />
            <span className={classes.capaTexto}>
              <Text fz={14} fw={600} c="var(--mantine-color-text)">
                Arraste a imagem de capa ou clique para escolher
              </Text>
              <Text fz={12} c="dimmed">
                Opcional · formato 4:1 · PNG ou JPG, até 10 MB
              </Text>
            </span>
          </Dropzone>
        </SeDesabilitado>
      )}
      {img.modal}
    </>
  );
}

/** Foto de perfil redonda (opcional), sobreposta à capa. */
export function FotoUpload(props: ImagemProps) {
  const img = useImagem("foto", props);
  const bloqueado = props.desabilitado || img.habilitado === false;
  const entrada = useRef<HTMLInputElement>(null);

  let circulo: React.ReactNode;
  if (img.erro && !img.exibida) {
    circulo = (
      <FileButton onChange={img.escolher} accept={ACCEPT.join(",")} disabled={bloqueado}>
        {(p) => (
          <UnstyledButton {...p} className={classes.fotoErro} aria-label="Tentar enviar a foto novamente">
            <IconAlertCircle size={26} stroke={1.75} />
          </UnstyledButton>
        )}
      </FileButton>
    );
  } else if (img.exibida) {
    circulo = (
      <>
        <span className={classes.foto} data-enviando={img.enviando || undefined}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.exibida} alt="Foto de perfil" />
          {img.enviando && <span className={classes.fotoPct}>{img.progresso}%</span>}
        </span>
        {!img.enviando && (
          <Menu position="bottom-start" withinPortal>
            <Menu.Target>
              <ActionIcon className={classes.fotoBotao} radius="xl" aria-label="Trocar, ajustar ou remover foto" disabled={props.desabilitado}>
                <IconCamera size={15} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconRefresh size={16} />} disabled={bloqueado} onClick={() => entrada.current?.click()}>
                Trocar
              </Menu.Item>
              {img.podeAjustar && (
                <Menu.Item leftSection={<IconCrop size={16} />} onClick={img.ajustar}>
                  Ajustar
                </Menu.Item>
              )}
              <Menu.Item leftSection={<IconTrash size={16} />} color="red" onClick={img.remover}>
                Remover
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
      </>
    );
  } else {
    circulo = (
      <SeDesabilitado ativo={img.habilitado === false}>
        <FileButton onChange={img.escolher} accept={ACCEPT.join(",")} disabled={bloqueado}>
          {(p) => (
            <UnstyledButton {...p} className={classes.fotoVazia} aria-label="Enviar foto de perfil" disabled={bloqueado}>
              <IconCamera size={26} stroke={1.5} />
            </UnstyledButton>
          )}
        </FileButton>
      </SeDesabilitado>
    );
  }

  return (
    <div className={classes.fotoLinha}>
      <input
        ref={entrada}
        type="file"
        accept={ACCEPT.join(",")}
        hidden
        onChange={(e) => {
          img.escolher(e.currentTarget.files?.[0] ?? null);
          e.currentTarget.value = "";
        }}
      />
      <span className={classes.fotoCaixa}>{circulo}</span>
      <span className={classes.fotoInfo}>
        <Text fz={14} fw={500}>
          Foto de perfil{" "}
          <Text component="span" fz={14} fw={400} c="dimmed">
            (opcional)
          </Text>
        </Text>
        {img.erro ? (
          <Text fz={12} c="var(--app-err)">
            {img.erro}
          </Text>
        ) : img.enviando ? (
          <Text fz={12} c="dimmed">
            Salvar fica desabilitado até terminar o envio.
          </Text>
        ) : (
          <Text fz={12} c="dimmed">
            {img.habilitado === false ? MSG_UPLOAD_DESABILITADO : "PNG ou JPG, até 10 MB. Você poderá ajustar o enquadramento."}
          </Text>
        )}
      </span>
      {img.modal}
    </div>
  );
}
