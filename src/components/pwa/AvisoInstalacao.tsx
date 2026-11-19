"use client";

import { useEffect, useRef, useState } from "react";
import { Affix, Button, CloseButton, Group, Paper, Text, Transition } from "@mantine/core";
import { IconDownload, IconShare2, IconSquarePlus } from "@tabler/icons-react";
import { Marca } from "@/components/Logo";
import { CHAVE_DISPENSADO, dispensadoRecente, ehSafariIos } from "@/lib/pwa/instalacao";
import classes from "./pwa.module.css";

/** Evento do Chromium (não padronizado, por isso sem tipo no DOM lib). */
interface EventoInstalacao extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    /** Guardado pelo script inline do layout, caso o evento chegue antes da hidratação. */
    __iaPromptInstalacao?: EventoInstalacao;
  }
}

// Espera um pouco antes de mostrar, para o aviso não competir com o carregamento da tela.
const ATRASO_MS = 1500;

type Modo = "prompt" | "ios";

function jaInstalado(): boolean {
  const standaloneIos = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return standaloneIos || window.matchMedia("(display-mode: standalone)").matches;
}

function lerDispensado(): string | null {
  try {
    return localStorage.getItem(CHAVE_DISPENSADO);
  } catch {
    return null;
  }
}

function gravarDispensado() {
  try {
    localStorage.setItem(CHAVE_DISPENSADO, String(Date.now()));
  } catch {
    // Sem storage (aba privada etc.): o aviso só volta na próxima visita.
  }
}

/** Registra o service worker e convida quem ainda não instalou o app. Fica em todas as telas. */
export function AvisoInstalacao() {
  const [modo, setModo] = useState<Modo | null>(null);
  const [instalando, setInstalando] = useState(false);
  const evento = useRef<EventoInstalacao | null>(null);

  // No `next dev` o SW atrapalharia o HMR; só registra no build de produção.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (jaInstalado() || dispensadoRecente(lerDispensado(), Date.now())) return;

    let timer: number | undefined;
    const agendar = (proximo: Modo) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setModo(proximo), ATRASO_MS);
    };

    const aoFicarInstalavel = () => {
      if (!window.__iaPromptInstalacao) return;
      evento.current = window.__iaPromptInstalacao;
      agendar("prompt");
    };
    const aoInstalar = () => {
      window.clearTimeout(timer);
      evento.current = null;
      window.__iaPromptInstalacao = undefined;
      setModo(null);
    };

    window.addEventListener("ia:instalavel", aoFicarInstalavel);
    window.addEventListener("appinstalled", aoInstalar);

    if (window.__iaPromptInstalacao) aoFicarInstalavel();
    else if (ehSafariIos(navigator.userAgent, navigator.maxTouchPoints)) agendar("ios");

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("ia:instalavel", aoFicarInstalavel);
      window.removeEventListener("appinstalled", aoInstalar);
    };
  }, []);

  const dispensar = () => {
    gravarDispensado();
    setModo(null);
  };

  const instalar = async () => {
    const prompt = evento.current;
    if (!prompt) return;
    setInstalando(true);
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === "dismissed") gravarDispensado();
    } finally {
      // O evento só pode ser usado uma vez.
      evento.current = null;
      window.__iaPromptInstalacao = undefined;
      setInstalando(false);
      setModo(null);
    }
  };

  return (
    <Affix position={{ bottom: 0, left: 0, right: 0 }} className={classes.affix}>
      <Transition mounted={modo !== null} transition="slide-up" duration={250}>
        {(estilos) => (
          <div className={classes.area}>
            <Paper
              role="dialog"
              aria-labelledby="aviso-instalacao-titulo"
              withBorder
              shadow="lg"
              radius="lg"
              p="md"
              className={classes.aviso}
              style={estilos}
            >
              <CloseButton className={classes.fechar} size="sm" aria-label="Fechar aviso de instalação" onClick={dispensar} />
              <Group gap={14} wrap="nowrap" align="flex-start" pr={28}>
                <Marca tamanho={44} className={classes.marca} />
                <div>
                  <Text id="aviso-instalacao-titulo" fw={700} fz={15}>
                    Instale o InStartups
                  </Text>
                  {modo === "ios" ? (
                    <Text fz={13} c="dimmed" mt={2} lh={1.5}>
                      Toque em <IconShare2 size={16} stroke={1.75} className={classes.iconeTexto} aria-label="Compartilhar" />{" "}
                      <b>Compartilhar</b> e depois em{" "}
                      <IconSquarePlus size={16} stroke={1.75} className={classes.iconeTexto} aria-hidden />{" "}
                      <b>Adicionar à Tela de Início</b>.
                    </Text>
                  ) : (
                    <Text fz={13} c="dimmed" mt={2} lh={1.5}>
                      Acesse mais rápido, direto da tela inicial, em uma janela só do app.
                    </Text>
                  )}
                </div>
              </Group>

              <Group justify="flex-end" gap={8} mt={12}>
                {modo === "ios" ? (
                  <Button size="xs" variant="default" onClick={dispensar}>
                    Entendi
                  </Button>
                ) : (
                  <>
                    <Button size="xs" variant="subtle" color="gray" onClick={dispensar}>
                      Agora não
                    </Button>
                    <Button size="xs" leftSection={<IconDownload size={16} stroke={2} />} onClick={instalar} loading={instalando}>
                      Instalar
                    </Button>
                  </>
                )}
              </Group>
            </Paper>
          </div>
        )}
      </Transition>
    </Affix>
  );
}
