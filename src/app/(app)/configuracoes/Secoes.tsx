"use client";

import { useState, type ReactNode } from "react";
import {
  Button,
  Group,
  PasswordInput,
  SegmentedControl,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Title,
  useMantineColorScheme,
  type MantineColorScheme,
} from "@mantine/core";
import { IconInfoCircle, IconLogout } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import type { Coordenada, MeuPerfil, UsuarioMe } from "@/lib/api/tipos";
import { api, requisitar } from "@/lib/api/cliente";
import { ErroApi, mensagemDoErro } from "@/lib/api/erros";
import { formatarTelefone, mascararUserName } from "@/lib/formato/texto";
import {
  LIMITES_CONTA,
  telefoneParaApi,
  validarEmail,
  validarObrigatorio,
  validarSenha,
  validarTelefone,
  validarUserName,
} from "@/lib/validacao/conta";
import { validarCoordenada } from "@/lib/validacao/perfil";
import { aplicarErrosServidor, useFormulario } from "@/hooks/useFormulario";
import { chaves, useStatusPerfil, useUsuario } from "@/hooks/dados";
import { confirmar, TEXTOS_CONFIRMACAO } from "@/lib/confirmar";
import { notificarErro, notificarSucesso } from "@/lib/notificar";
import { sair } from "@/components/app/Navbar";
import { BadgeAtivo, BadgeDesativada } from "@/components/comum/Badges";
import { RequisitosSenha } from "@/components/cadastro/RequisitosSenha";
import { MapaLocal } from "@/components/mapa/MapaLocal";
import classes from "./configuracoes.module.css";

function Secao({ id, titulo, descricao, children }: { id: string; titulo: string; descricao: string; children: ReactNode }) {
  return (
    <section id={id} className={classes.secao} aria-labelledby={`${id}-titulo`}>
      <Stack gap={2}>
        <Title order={2} fz={18} id={`${id}-titulo`}>
          {titulo}
        </Title>
        <Text fz={13} c="dimmed">
          {descricao}
        </Text>
      </Stack>
      {children}
    </section>
  );
}

const ORDEM = ["label", "input", "description", "error"] as ("label" | "input" | "description" | "error")[];

// ---------- Conta: PUT /api/user/me ----------
interface ValoresConta extends Record<string, unknown> {
  userName: string;
  email: string;
  phoneNumber: string;
}

export function SecaoConta() {
  const { data: usuario } = useUsuario();
  return (
    <Secao id="cfg-conta" titulo="Conta" descricao="Dados de acesso. Não aparecem no seu perfil público.">
      {usuario ? <FormConta usuario={usuario} /> : <Skeleton height={150} radius="md" />}
    </Secao>
  );
}

function FormConta({ usuario }: { usuario: UsuarioMe }) {
  const qc = useQueryClient();
  const { form, enviar } = useFormulario<ValoresConta>({
    initialValues: {
      userName: usuario.userName,
      email: usuario.email,
      phoneNumber: formatarTelefone(usuario.phoneNumber ?? ""),
    },
    validate: { userName: validarUserName, email: validarEmail, phoneNumber: validarTelefone },
  });

  const salvar = async (v: ValoresConta) => {
    try {
      const atualizado = await api<UsuarioMe>("auth", "user/me", {
        metodo: "PUT",
        corpo: { userName: v.userName.trim(), email: v.email.trim(), phoneNumber: telefoneParaApi(v.phoneNumber) },
      });
      qc.setQueryData(chaves.usuario, atualizado);
      qc.invalidateQueries({ queryKey: chaves.meuPerfil });
      form.resetDirty({
        userName: atualizado.userName,
        email: atualizado.email,
        phoneNumber: formatarTelefone(atualizado.phoneNumber ?? ""),
      });
      notificarSucesso("Dados da conta atualizados.");
    } catch (erro) {
      if (!aplicarErrosServidor(form, erro)) notificarErro(erro);
    }
  };

  return (
    <form onSubmit={enviar(salvar)} noValidate>
      <Stack gap={16}>
        <Group grow align="flex-start" gap={16} wrap="wrap" style={{ rowGap: 16 }}>
          <TextInput
            label="Nome de usuário"
            autoComplete="username"
            maxLength={LIMITES_CONTA.userName}
            leftSection={<Text fz={14} c="dimmed">@</Text>}
            inputWrapperOrder={ORDEM}
            description={form.errors.userName ? undefined : "Até 20 caracteres: letras, números e - . _ @ +"}
            miw={220}
            {...form.getInputProps("userName")}
            onChange={(e) => {
              const mascarado = mascararUserName(e.currentTarget.value, LIMITES_CONTA.userName);
              e.currentTarget.value = mascarado;
              form.setFieldValue("userName", mascarado);
            }}
          />
          <TextInput
            label="E-mail"
            type="email"
            autoComplete="email"
            maxLength={LIMITES_CONTA.email}
            miw={220}
            {...form.getInputProps("email")}
          />
        </Group>
        <TextInput
          label={
            <>
              Telefone{" "}
              <Text component="span" fz={14} fw={400} c="dimmed">
                (opcional)
              </Text>
            </>
          }
          type="tel"
          inputMode="numeric"
          placeholder="(16) 99999-0000"
          maxLength={15}
          autoComplete="tel"
          maw={320}
          inputWrapperOrder={ORDEM}
          description={form.errors.phoneNumber ? undefined : "Somente números, com DDD."}
          {...form.getInputProps("phoneNumber")}
          onChange={(e) => {
            const mascarado = formatarTelefone(e.currentTarget.value);
            e.currentTarget.value = mascarado;
            form.setFieldValue("phoneNumber", mascarado);
          }}
        />
        <Group justify="flex-end">
          <Button type="submit" loading={form.submitting} disabled={!form.isDirty()}>
            Salvar alterações
          </Button>
        </Group>
      </Stack>
    </form>
  );
}

// ---------- Senha: PUT /api/user/me/password (encerra todas as sessões) ----------
interface ValoresSenha extends Record<string, unknown> {
  currentPassword: string;
  newPassword: string;
}

export function SecaoSenha() {
  const { form, enviar } = useFormulario<ValoresSenha>({
    initialValues: { currentPassword: "", newPassword: "" },
    validate: { currentPassword: validarObrigatorio, newPassword: validarSenha },
  });

  const alterar = async (v: ValoresSenha) => {
    try {
      await api("auth", "user/me/password", { metodo: "PUT", corpo: v });
      // A API revoga todas as sessões, inclusive esta: limpa os cookies e volta ao login.
      await requisitar("/api/sessao/logout", { metodo: "POST" }).catch(() => undefined);
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/login?senha=1");
    } catch (erro) {
      if (erro instanceof ErroApi && erro.message === "Credenciais inválidas.") {
        form.setFieldError("currentPassword", "Senha atual incorreta.");
        return;
      }
      if (!aplicarErrosServidor(form, erro)) notificarErro(erro);
    }
  };

  return (
    <Secao
      id="cfg-senha"
      titulo="Senha"
      descricao="8 a 20 caracteres, com maiúscula, minúscula, número e caractere especial."
    >
      <form onSubmit={enviar(alterar)} noValidate>
        <Stack gap={16}>
          <Group grow align="flex-start" gap={16} wrap="wrap" style={{ rowGap: 16 }}>
            <PasswordInput
              label="Senha atual"
              autoComplete="current-password"
              maxLength={LIMITES_CONTA.senhaMax}
              miw={220}
              visibilityToggleButtonProps={{ "aria-label": "Mostrar senha atual" }}
              {...form.getInputProps("currentPassword")}
            />
            <Stack gap={8} miw={220}>
              <PasswordInput
                label="Nova senha"
                autoComplete="new-password"
                maxLength={LIMITES_CONTA.senhaMax}
                visibilityToggleButtonProps={{ "aria-label": "Mostrar nova senha" }}
                aria-describedby="requisitos-nova-senha"
                {...form.getInputProps("newPassword")}
              />
              {form.values.newPassword && <RequisitosSenha senha={form.values.newPassword} id="requisitos-nova-senha" />}
            </Stack>
          </Group>
          <div role="note" className={classes.nota}>
            <IconInfoCircle size={18} stroke={2} style={{ flex: "none" }} aria-hidden />
            Ao alterar a senha, todas as sessões são encerradas e você precisará entrar novamente.
          </div>
          <Group justify="flex-end">
            <Button type="submit" loading={form.submitting}>
              Alterar senha
            </Button>
          </Group>
        </Stack>
      </form>
    </Secao>
  );
}

// ---------- Sessões ----------
export function SecaoSessoes() {
  const [saindoTodos, setSaindoTodos] = useState(false);

  const sairDeTodos = () =>
    confirmar({
      titulo: "Sair de todos os dispositivos?",
      texto: "Todas as sessões da sua conta serão encerradas, inclusive esta. Você precisará entrar novamente.",
      confirmar: "Sair de todos",
      onConfirmar: async () => {
        setSaindoTodos(true);
        try {
          await requisitar("/api/sessao/logout-todos", { metodo: "POST" });
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.assign("/login");
        } catch (erro) {
          setSaindoTodos(false);
          notificarErro(erro);
        }
      },
    });

  return (
    <Secao id="cfg-sessoes" titulo="Sessões" descricao="Sua conta pode ficar conectada em até 3 dispositivos ao mesmo tempo.">
      <Group gap={8}>
        <Button variant="default" leftSection={<IconLogout size={16} stroke={1.75} />} onClick={sair}>
          Sair deste dispositivo
        </Button>
        <Button variant="light" color="red" className={classes.destrutivo} onClick={sairDeTodos} loading={saindoTodos}>
          Sair de todos os dispositivos
        </Button>
      </Group>
    </Secao>
  );
}

// ---------- Localização: PATCH /perfil/coordenada ----------
export function SecaoLocalizacao({ perfil }: { perfil: MeuPerfil }) {
  const qc = useQueryClient();
  const [coordenada, setCoordenada] = useState<Coordenada | null>(perfil.coordenada);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const mudou =
    coordenada?.latitude !== perfil.coordenada.latitude || coordenada?.longitude !== perfil.coordenada.longitude;

  const salvar = async () => {
    const invalido = validarCoordenada(coordenada);
    setErro(invalido);
    if (invalido || !coordenada) return;
    setSalvando(true);
    try {
      await api("command", "perfil/coordenada", { metodo: "PATCH", corpo: coordenada });
      notificarSucesso("Localização atualizada.");
      await qc.invalidateQueries({ queryKey: chaves.meuPerfil });
      qc.invalidateQueries({ queryKey: chaves.postagens });
      qc.invalidateQueries({ queryKey: ["perfil"] });
    } catch (e) {
      if (e instanceof ErroApi && e.campos.coordenada) setErro(e.campos.coordenada);
      else notificarErro(e);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Secao
      id="cfg-local"
      titulo="Localização do perfil"
      descricao="Ponto de partida dos filtros por distância. Clique no mapa, arraste o marcador ou use sua localização atual."
    >
      <MapaLocal
        valor={coordenada}
        onChange={(c) => {
          setCoordenada(c);
          setErro(null);
        }}
        erro={erro}
        altura={260}
        desabilitado={!perfil.ativo}
      />
      {!perfil.ativo && (
        <Text fz={12} c="dimmed">
          Reative o perfil para alterar a localização.
        </Text>
      )}
      <Group justify="flex-end">
        <Button onClick={salvar} loading={salvando} disabled={!mudou || !perfil.ativo}>
          Salvar localização
        </Button>
      </Group>
    </Secao>
  );
}

// ---------- Perfil: PATCH /perfil/desativar | /perfil/reativar ----------
export function SecaoPerfil({ perfil }: { perfil: MeuPerfil }) {
  const status = useStatusPerfil();
  const tipo = perfil.tipo === "STARTUP" ? "Startup" : "Investidor";

  const desativar = () =>
    confirmar({
      titulo: "Desativar perfil?",
      texto: TEXTOS_CONFIRMACAO.desativarPerfil,
      confirmar: "Desativar perfil",
      onConfirmar: () => status.mutate(false, { onSuccess: () => notificarSucesso("Perfil desativado.") }),
    });

  return (
    <Secao id="cfg-perfil" titulo="Perfil" descricao={`Tipo: ${tipo} · não pode ser alterado.`}>
      <div className={classes.statusCaixa}>
        <Stack gap={4} style={{ flex: "1 1 300px" }}>
          <Group gap={8}>
            <Text fz={14} fw={600}>
              Status
            </Text>
            {perfil.ativo ? <BadgeAtivo /> : <BadgeDesativada rotulo="DESATIVADO" />}
          </Group>
          <Text fz={13} c="dimmed">
            Desativado, o perfil não pode editar, publicar, curtir nem seguir. As postagens continuam no ar. Dá para reativar a
            qualquer momento.
          </Text>
        </Stack>
        {perfil.ativo ? (
          <Button variant="light" color="red" className={classes.destrutivo} onClick={desativar} loading={status.isPending}>
            Desativar perfil
          </Button>
        ) : (
          <Button
            onClick={() => status.mutate(true, { onSuccess: () => notificarSucesso("Perfil reativado.") })}
            loading={status.isPending}
          >
            Reativar perfil
          </Button>
        )}
      </div>
      {status.isError && (
        <Text fz={12} c="var(--app-err)">
          {mensagemDoErro(status.error)}
        </Text>
      )}
    </Secao>
  );
}

// ---------- Aparência ----------
export function SecaoAparencia() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  return (
    <Secao id="cfg-aparencia" titulo="Aparência" descricao="Salvo neste navegador.">
      <SegmentedControl
        aria-label="Tema"
        value={colorScheme}
        onChange={(v) => setColorScheme(v as MantineColorScheme)}
        data={[
          { value: "light", label: "Claro" },
          { value: "dark", label: "Escuro" },
          { value: "auto", label: "Sistema" },
        ]}
        style={{ alignSelf: "flex-start" }}
      />
    </Secao>
  );
}
