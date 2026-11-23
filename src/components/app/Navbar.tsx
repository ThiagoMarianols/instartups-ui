"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ActionIcon, Button, Menu, Stack, Text, Tooltip, useComputedColorScheme, useMantineColorScheme } from "@mantine/core";
import {
  IconDots,
  IconHome,
  IconLogout,
  IconMoon,
  IconPlus,
  IconSearch,
  IconSettings,
  IconSun,
  IconUser,
} from "@tabler/icons-react";
import { useUsuario } from "@/hooks/dados";
import { requisitar } from "@/lib/api/cliente";
import { AvatarPerfil } from "@/components/comum/AvatarPerfil";
import { Logo } from "@/components/Logo";
import { useSessao } from "./Sessao";
import classes from "./app.module.css";

const LINKS = [
  { href: "/feed", rotulo: "Feed", Icone: IconHome },
  { href: "/busca", rotulo: "Buscar", Icone: IconSearch },
  { href: "/perfil/me", rotulo: "Meu perfil", Icone: IconUser },
  { href: "/configuracoes", rotulo: "Configurações", Icone: IconSettings },
];

export async function sair() {
  try {
    await requisitar("/api/sessao/logout", { metodo: "POST" });
  } finally {
    // Recarga completa: descarta o cache da sessão encerrada.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/login");
  }
}

/** Navbar (artboard "Componente · Navbar"): AppShell.Navbar + NavLink. */
export function Navbar({ onNavegar }: { onNavegar?: () => void }) {
  const pathname = usePathname();
  const { perfil, abrirNovaPostagem } = useSessao();
  const { data: usuario } = useUsuario();
  const { setColorScheme } = useMantineColorScheme();
  const esquema = useComputedColorScheme("light");
  const escuro = esquema === "dark";

  return (
    <nav aria-label="Navegação principal" className={classes.navbar}>
      <Link href="/feed" className={classes.marca} onClick={onNavegar}>
        <Logo />
      </Link>

      <Stack gap={4}>
        {LINKS.map(({ href, rotulo, Icone }) => {
          const ativo = pathname === href || (href === "/perfil/me" && pathname.startsWith("/perfil/me"));
          return (
            <Link
              key={href}
              href={href}
              className={classes.link}
              data-ativo={ativo || undefined}
              aria-current={ativo ? "page" : undefined}
              onClick={onNavegar}
            >
              <Icone size={22} stroke={1.75} aria-hidden />
              {rotulo}
            </Link>
          );
        })}
      </Stack>

      {perfil.ativo ? (
        <Button
          h={44}
          size="md"
          fz={15}
          leftSection={<IconPlus size={18} stroke={2} />}
          onClick={() => {
            onNavegar?.();
            abrirNovaPostagem();
          }}
        >
          Nova postagem
        </Button>
      ) : (
        <Tooltip label="Perfil desativado: reative para publicar.">
          <Button h={44} size="md" fz={15} leftSection={<IconPlus size={18} stroke={2} />} disabled>
            Nova postagem
          </Button>
        </Tooltip>
      )}

      <div className={classes.usuario}>
        <Link href="/perfil/me" className={classes.usuarioLink} onClick={onNavegar}>
          <AvatarPerfil nome={perfil.nome} tipo={perfil.tipo} src={perfil.imagemPerfilUrl} tamanho={38} />
          <div className={classes.usuarioTexto}>
            <Text fz={14} fw={600} truncate>
              {perfil.nome}
            </Text>
            <Text fz={12} c="dimmed" truncate>
              @{usuario?.userName ?? perfil.usuario ?? ""}
            </Text>
          </div>
        </Link>
        <Menu position="top-end" width={220} shadow="md">
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray" size={36} aria-label="Menu da conta">
              <IconDots size={20} stroke={1.75} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={escuro ? <IconSun size={16} /> : <IconMoon size={16} />}
              onClick={() => setColorScheme(escuro ? "light" : "dark")}
            >
              {escuro ? "Tema claro" : "Tema escuro"}
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item leftSection={<IconLogout size={16} />} onClick={sair}>
              Sair
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </div>
    </nav>
  );
}
