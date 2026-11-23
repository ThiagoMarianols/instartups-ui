"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import { ActionIcon } from "@mantine/core";
import { IconChevronLeft, IconChevronRight, IconMaximize } from "@tabler/icons-react";
import type { Midia } from "@/lib/api/tipos";
import classes from "./postagem.module.css";

interface Props {
  midias: Midia[];
  /** Nome do autor, para o texto alternativo das fotos. */
  autor: string;
  /** Slide exibido ao montar. */
  inicial?: number;
  /** Modo tela cheia (visualizador): mídia inteira, fundo escuro. */
  ampliado?: boolean;
  onAbrir?: (indice: number) => void;
  /** Ao dar duplo clique/toque em uma foto no feed, alterna curtida em vez de ampliar. */
  onDuploCliqueFoto?: () => void;
}

/** Carrossel de mídias da postagem: um slide por vez, deslize por toque (scroll-snap), setas e indicadores. */
export function CarrosselMidias({ midias, autor, inicial = 0, ampliado = false, onAbrir, onDuploCliqueFoto }: Props) {
  const trilho = useRef<HTMLDivElement>(null);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const timerClique = useRef<number | null>(null);
  const [atual, setAtual] = useState(inicial);
  const [natural, setNatural] = useState<number | null>(null);
  const n = midias.length;

  const limparTimerClique = () => {
    if (timerClique.current !== null) {
      window.clearTimeout(timerClique.current);
      timerClique.current = null;
    }
  };

  useEffect(() => () => limparTimerClique(), []);

  useLayoutEffect(() => {
    const el = trilho.current;
    if (el && inicial > 0) el.scrollLeft = inicial * el.clientWidth;
    // Só na montagem: depois disso o slide atual vem da rolagem.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Vídeo fora da tela não continua tocando.
  useEffect(() => {
    videos.current.forEach((v, i) => {
      if (v && i !== atual && !v.paused) v.pause();
    });
  }, [atual]);

  if (n === 0) return null;
  const varios = n > 1;

  const aoRolar = () => {
    limparTimerClique();
    const el = trilho.current;
    if (!el || el.clientWidth === 0) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    setAtual(Math.min(Math.max(i, 0), n - 1));
  };

  const tratarCliqueFoto = (e: MouseEvent<HTMLButtonElement>, i: number) => {
    if (!onAbrir) return;
    if (!onDuploCliqueFoto || e.detail === 0) {
      limparTimerClique();
      onAbrir(i);
      return;
    }
    if (timerClique.current !== null) {
      limparTimerClique();
      onDuploCliqueFoto();
      return;
    }
    timerClique.current = window.setTimeout(() => {
      timerClique.current = null;
      onAbrir(i);
    }, 260);
  };

  const ir = (i: number) => {
    const el = trilho.current;
    if (!el) return;
    const alvo = Math.min(Math.max(i, 0), n - 1);
    el.scrollTo({ left: alvo * el.clientWidth, behavior: "smooth" });
  };

  const aoTeclar = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      ir(atual - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      ir(atual + 1);
    }
  };

  // A 1ª mídia define a proporção do carrossel (limitada entre 4:5 e 1,91:1, como no Instagram).
  const medir = (largura: number, altura: number) => {
    if (largura > 0 && altura > 0) setNatural(Math.min(1.91, Math.max(0.8, largura / altura)));
  };
  const proporcao = ampliado ? undefined : natural ?? (n === 1 ? 16 / 9 : 4 / 5);

  return (
    <div className={classes.carrossel} data-ampliado={ampliado || undefined}>
      <div
        ref={trilho}
        className={classes.trilho}
        style={{ aspectRatio: proporcao }}
        onScroll={aoRolar}
        onKeyDown={varios ? aoTeclar : undefined}
        tabIndex={varios ? 0 : undefined}
        role={varios ? "region" : undefined}
        aria-roledescription={varios ? "carrossel" : undefined}
        aria-label={varios ? `Mídias da postagem de ${autor}` : undefined}
        data-autofocus={ampliado || undefined}
      >
        {midias.map((m, i) => {
          const foto = (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={
                i === 0
                  ? (img) => {
                      if (img?.complete) medir(img.naturalWidth, img.naturalHeight);
                    }
                  : undefined
              }
              src={m.url}
              alt={`Foto ${i + 1} da postagem de ${autor}`}
              loading={i === 0 ? "eager" : "lazy"}
              draggable={false}
              onLoad={i === 0 ? (e) => medir(e.currentTarget.naturalWidth, e.currentTarget.naturalHeight) : undefined}
            />
          );
          return (
            <div
              key={m.id}
              className={classes.slide}
              role={varios ? "group" : undefined}
              aria-roledescription={varios ? "slide" : undefined}
              aria-label={varios ? `Mídia ${i + 1} de ${n}` : undefined}
            >
              {m.tipo === "VIDEO" ? (
                <>
                  <video
                    ref={(v) => {
                      videos.current[i] = v;
                    }}
                    src={m.url}
                    controls
                    preload="metadata"
                    playsInline
                    aria-label={`Vídeo ${i + 1} da postagem`}
                    onLoadedMetadata={
                      i === 0 ? (e) => medir(e.currentTarget.videoWidth, e.currentTarget.videoHeight) : undefined
                    }
                  />
                  {!ampliado && onAbrir && (
                    <ActionIcon
                      className={classes.ampliar}
                      variant="filled"
                      color="dark"
                      radius="xl"
                      size={30}
                      aria-label="Ampliar vídeo"
                      onClick={() => onAbrir(i)}
                    >
                      <IconMaximize size={16} stroke={2} />
                    </ActionIcon>
                  )}
                </>
              ) : !ampliado && onAbrir ? (
                <button
                  type="button"
                  className={classes.abrirSlide}
                  aria-label={`Ampliar foto ${i + 1}`}
                  onClick={(e) => tratarCliqueFoto(e, i)}
                >
                  {foto}
                </button>
              ) : (
                foto
              )}
            </div>
          );
        })}
      </div>

      {varios && (
        <>
          <span className={classes.contador} aria-live="polite">
            {atual + 1}/{n}
          </span>
          {atual > 0 && (
            <ActionIcon
              className={classes.seta}
              data-lado="esquerda"
              variant="white"
              color="dark"
              radius="xl"
              size={ampliado ? 40 : 30}
              aria-label="Mídia anterior"
              onClick={() => ir(atual - 1)}
            >
              <IconChevronLeft size={ampliado ? 22 : 18} stroke={2.25} />
            </ActionIcon>
          )}
          {atual < n - 1 && (
            <ActionIcon
              className={classes.seta}
              data-lado="direita"
              variant="white"
              color="dark"
              radius="xl"
              size={ampliado ? 40 : 30}
              aria-label="Próxima mídia"
              onClick={() => ir(atual + 1)}
            >
              <IconChevronRight size={ampliado ? 22 : 18} stroke={2.25} />
            </ActionIcon>
          )}
          <div className={classes.pontos} aria-hidden>
            {midias.map((m, i) => (
              <span key={m.id} className={classes.ponto} data-ativo={i === atual || undefined} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
