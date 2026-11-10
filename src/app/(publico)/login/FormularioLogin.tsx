"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Alert, Button, PasswordInput, Stack, Text, TextInput, Title } from "@mantine/core";
import { IconAlertCircle, IconInfoCircle } from "@tabler/icons-react";
import { requisitar } from "@/lib/api/cliente";
import { ErroApi, mensagemDoErro } from "@/lib/api/erros";
import { LIMITES_CONTA, validarObrigatorio } from "@/lib/validacao/conta";
import { aplicarErrosServidor, useFormulario } from "@/hooks/useFormulario";
import classes from "./login.module.css";

interface ValoresLogin extends Record<string, unknown> {
  userNameOrEmail: string;
  password: string;
}

/** Só aceita caminhos internos do app no ?voltar= (evita redirecionamento aberto). */
function destinoSeguro(voltar: string | null, padrao: string): string {
  if (padrao !== "/feed" || !voltar) return padrao;
  return voltar.startsWith("/") && !voltar.startsWith("//") ? voltar : padrao;
}

export function FormularioLogin() {
  const params = useSearchParams();
  const [erroGeral, setErroGeral] = useState<{ texto: string; detalhe?: string } | null>(null);
  const [credencialInvalida, setCredencialInvalida] = useState(false);

  const { form, enviar } = useFormulario<ValoresLogin>({
    initialValues: { userNameOrEmail: "", password: "" },
    validate: {
      userNameOrEmail: validarObrigatorio,
      password: (v) => (v ? null : "O campo é obrigatório."),
    },
    onValuesChange: () => setCredencialInvalida(false),
  });

  const entrar = async (valores: ValoresLogin) => {
    setErroGeral(null);
    setCredencialInvalida(false);
    try {
      const { destino } = await requisitar<{ destino: string }>("/api/sessao/login", {
        metodo: "POST",
        corpo: { userNameOrEmail: valores.userNameOrEmail.trim(), password: valores.password },
        contexto: "login",
      });
      window.location.assign(destinoSeguro(params.get("voltar"), destino));
    } catch (erro) {
      if (aplicarErrosServidor(form, erro)) return;
      const texto = mensagemDoErro(erro);
      if (erro instanceof ErroApi && texto === "Credenciais inválidas.") setCredencialInvalida(true);
      setErroGeral({
        texto,
        detalhe:
          texto === "Limite de sessões ativas atingido."
            ? "Sua conta já está conectada em 3 dispositivos. Saia de um deles para entrar aqui."
            : undefined,
      });
    }
  };

  const aviso = params.get("expirada")
    ? "Sua sessão expirou. Entre novamente."
    : params.get("cadastrado")
      ? "Conta criada. Entre para continuar o cadastro."
      : params.get("senha")
        ? "Senha alterada. Entre novamente com a nova senha."
        : null;

  return (
    <form className={classes.form} onSubmit={enviar(entrar)} noValidate>
      <Stack gap={6}>
        <Title order={2} fz={28} style={{ letterSpacing: "-0.01em" }}>
          Entrar
        </Title>
        <Text fz={15} c="dimmed">
          Use seu nome de usuário ou e-mail.
        </Text>
      </Stack>

      {aviso && !erroGeral && (
        <Alert variant="light" color="gray" icon={<IconInfoCircle size={18} />} p="sm">
          <Text fz={14}>{aviso}</Text>
        </Alert>
      )}

      {erroGeral && (
        <Alert role="alert" variant="light" color="red" icon={<IconAlertCircle size={18} />} p="sm">
          <Text fz={14} fw={600}>
            {erroGeral.texto}
          </Text>
          {erroGeral.detalhe && (
            <Text fz={13} c="var(--mantine-color-text)" mt={2}>
              {erroGeral.detalhe}
            </Text>
          )}
        </Alert>
      )}

      <TextInput
        label="Usuário ou e-mail"
        withAsterisk
        placeholder="voce@empresa.com"
        autoComplete="username"
        maxLength={LIMITES_CONTA.email}
        size="md"
        fz={15}
        {...form.getInputProps("userNameOrEmail")}
      />

      <PasswordInput
        label="Senha"
        withAsterisk
        placeholder="Sua senha"
        autoComplete="current-password"
        maxLength={LIMITES_CONTA.senhaMax}
        size="md"
        visibilityToggleButtonProps={{ "aria-label": "Mostrar senha" }}
        {...form.getInputProps("password")}
        error={form.errors.password ?? (credencialInvalida ? true : undefined)}
      />

      <Button type="submit" size="md" h={44} loading={form.submitting}>
        Entrar
      </Button>

      <div className={classes.divisor}>novo por aqui?</div>

      <Button component={Link} href="/cadastro" variant="default" size="md" h={44}>
        Criar conta
      </Button>
    </form>
  );
}
