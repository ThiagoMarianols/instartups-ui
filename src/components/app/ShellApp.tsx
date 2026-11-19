"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { AppShell, Burger, Button, Loader, Modal, Stack, Text } from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { useMeuPerfil } from "@/hooks/dados";
import { requisitar } from "@/lib/api/cliente";
import { ErroApi, mensagemDoErro } from "@/lib/api/erros";
import { Logo } from "@/components/Logo";
import { Compositor } from "@/components/postagem/Compositor";
import { Navbar } from "./Navbar";
import { SessaoContexto } from "./Sessao";
import classes from "./app.module.css";

/** Layout das telas logadas. Garante o perfil (Q1) antes de renderizar as páginas. */
export function ShellApp({ children }: { children: ReactNode }) {
  const [menuAberto, menu] = useDisclosure(false);
  const [novaAberta, nova] = useDisclosure(false);
  const mobile = useMediaQuery("(max-width: 48em)", false);
  const { data: perfil, error, refetch, isFetching } = useMeuPerfil();

  // Sem perfil (404 na Q1): volta para a escolha do tipo.
  const semPerfil = error instanceof ErroApi && error.status === 404;
  useEffect(() => {
    if (!semPerfil) return;
    requisitar("/api/sessao/perfil", { metodo: "POST", corpo: { temPerfil: false } }).finally(() =>
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/cadastro/tipo"),
    );
  }, [semPerfil]);

  const sessao = useMemo(() => (perfil ? { perfil, abrirNovaPostagem: nova.open } : null), [perfil, nova.open]);

  if (!sessao) {
    return (
      <div className={classes.carregando}>
        {error && !semPerfil ? (
          <Stack align="center" gap={12} maw={360} ta="center" p={16}>
            <Text fw={700}>Não foi possível carregar seu perfil.</Text>
            <Text fz={14} c="dimmed">
              {mensagemDoErro(error)}
            </Text>
            <Button variant="default" onClick={() => refetch()} loading={isFetching}>
              Tentar novamente
            </Button>
          </Stack>
        ) : (
          <Loader aria-label="Carregando" />
        )}
      </div>
    );
  }

  return (
    <SessaoContexto.Provider value={sessao}>
      <AppShell
        navbar={{ width: 260, breakpoint: "sm", collapsed: { mobile: !menuAberto } }}
        header={{ height: 56, collapsed: !mobile }}
        padding={0}
        styles={{ main: { background: "var(--app-page)" } }}
      >
        <AppShell.Header hiddenFrom="sm">
          <div className={classes.cabecalhoMobile}>
            <Burger opened={menuAberto} onClick={menu.toggle} size="sm" aria-label="Abrir menu" />
            <Logo />
          </div>
        </AppShell.Header>
        <AppShell.Navbar>
          <AppShell.Section grow component="div">
            <Navbar onNavegar={menu.close} />
          </AppShell.Section>
        </AppShell.Navbar>
        <AppShell.Main>{children}</AppShell.Main>
      </AppShell>

      <Modal opened={novaAberta} onClose={nova.close} title="Nova postagem" size={620} closeButtonProps={{ "aria-label": "Fechar" }}>
        <Compositor perfil={sessao.perfil} semMoldura autoFocus onPublicado={nova.close} />
      </Modal>
    </SessaoContexto.Provider>
  );
}
