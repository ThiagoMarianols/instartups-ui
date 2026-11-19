"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import type { MidiaNovaDTO, TipoMidia } from "@/lib/api/tipos";
import { MAX_MIDIAS, MSG_ARQUIVO, tipoMidiaDoMime, validarArquivo } from "@/lib/validacao/arquivos";
import { mensagemDoErro } from "@/lib/api/erros";
import { enviarArquivo, UploadCancelado } from "./useUpload";

export interface MidiaLocal {
  chave: string;
  tipo: TipoMidia;
  /** Arquivo como foi escolhido: o ajuste sempre parte dele. */
  original: string;
  /** O que é exibido e enviado (o original ou o recorte aplicado). */
  preview: string;
  progresso: number;
  url: string | null;
  erro: string | null;
}

/**
 * Mídias novas de uma postagem: valida (tipo/tamanho/limite), envia ao storage em paralelo
 * com progresso e permite cancelar/remover, reordenar e trocar uma foto pelo recorte ajustado.
 * `limiteRestante` considera as mídias já existentes.
 */
export function useMidiasUpload(onRejeitado: (mensagem: string) => void) {
  const [itens, setItens] = useState<MidiaLocal[]>([]);
  const controles = useRef(new Map<string, AbortController>());
  const urls = useRef<string[]>([]);

  useEffect(() => {
    const ctrls = controles.current;
    const criadas = urls.current;
    return () => {
      ctrls.forEach((c) => c.abort());
      criadas.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  const atualizar = (chave: string, patch: Partial<MidiaLocal>) =>
    setItens((lista) => lista.map((m) => (m.chave === chave ? { ...m, ...patch } : m)));

  const criarPreview = (arquivo: Blob) => {
    const url = URL.createObjectURL(arquivo);
    urls.current.push(url);
    return url;
  };

  const enviar = useCallback((chave: string, arquivo: File) => {
    const controle = new AbortController();
    controles.current.set(chave, controle);
    // Envio cancelado (removido ou substituído por um recorte) não mexe mais no item.
    const vigente = () => !controle.signal.aborted;
    enviarArquivo(arquivo, "midia", (p) => vigente() && atualizar(chave, { progresso: p }), controle.signal)
      .then((url) => vigente() && atualizar(chave, { url, progresso: 100 }))
      .catch((e) => {
        if (e instanceof UploadCancelado || !vigente()) return;
        atualizar(chave, { erro: mensagemDoErro(e) });
      })
      .finally(() => {
        if (controles.current.get(chave) === controle) controles.current.delete(chave);
      });
  }, []);

  const adicionar = useCallback(
    (arquivos: File[], ocupadas: number) => {
      let vagas = MAX_MIDIAS - ocupadas;
      const novos: { item: MidiaLocal; arquivo: File }[] = [];
      for (const arquivo of arquivos) {
        const invalido = validarArquivo("midia", arquivo.type, arquivo.size);
        if (invalido) {
          onRejeitado(`${arquivo.name}: ${invalido}`);
          continue;
        }
        if (vagas <= 0) {
          onRejeitado(MSG_ARQUIVO.limiteMidias);
          break;
        }
        vagas--;
        const preview = criarPreview(arquivo);
        novos.push({
          arquivo,
          item: {
            chave: crypto.randomUUID(),
            tipo: tipoMidiaDoMime(arquivo.type) as TipoMidia,
            original: preview,
            preview,
            progresso: 0,
            url: null,
            erro: null,
          },
        });
      }
      if (novos.length === 0) return;
      setItens((lista) => [...lista, ...novos.map((n) => n.item)]);
      for (const { arquivo, item } of novos) enviar(item.chave, arquivo);
    },
    [onRejeitado, enviar],
  );

  const remover = (chave: string) => {
    controles.current.get(chave)?.abort();
    setItens((lista) => lista.filter((m) => m.chave !== chave));
  };

  const reordenar = (de: number, para: number) => setItens((lista) => arrayMove(lista, de, para));

  /** Troca a foto pelo recorte ajustado e reenvia (o envio anterior é cancelado/descartado). */
  const substituir = (chave: string, recorte: Blob) => {
    controles.current.get(chave)?.abort();
    const arquivo = new File([recorte], "midia.jpg", { type: "image/jpeg" });
    atualizar(chave, { preview: criarPreview(arquivo), progresso: 0, url: null, erro: null });
    enviar(chave, arquivo);
  };

  const limpar = () => {
    controles.current.forEach((c) => c.abort());
    controles.current.clear();
    setItens([]);
  };

  const enviando = itens.some((m) => !m.url && !m.erro);
  const comErro = itens.some((m) => m.erro);
  const prontas: MidiaNovaDTO[] = itens.filter((m) => m.url).map((m) => ({ url: m.url as string, tipo: m.tipo }));

  return { itens, adicionar, remover, reordenar, substituir, limpar, enviando, comErro, prontas };
}
