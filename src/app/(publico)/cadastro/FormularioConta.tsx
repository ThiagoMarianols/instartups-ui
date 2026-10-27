"use client";

import { useState } from "react";
import { Alert, Button, PasswordInput, Stack, Text, TextInput, Title } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { requisitar } from "@/lib/api/cliente";
import { mensagemDoErro } from "@/lib/api/erros";
import { validarEmail, validarSenha, validarTelefone, validarUserName } from "@/lib/validacao/conta";
import { aplicarErrosServidor, useFormulario } from "@/hooks/useFormulario";
import { RequisitosSenha } from "@/components/cadastro/RequisitosSenha";
import classes from "@/components/cadastro/cadastro.module.css";

interface ValoresConta extends Record<string, unknown> {
  userName: string;
  email: string;
  password: string;
  phoneNumber: string;
}

export function FormularioConta() {
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const { form, enviar } = useFormulario<ValoresConta>({
    initialValues: { userName: "", email: "", password: "", phoneNumber: "" },
    validate: {
      userName: validarUserName,
      email: validarEmail,
      password: validarSenha,
      phoneNumber: validarTelefone,
    },
  });

  const criar = async (v: ValoresConta) => {
    setErroGeral(null);
    try {
      const { destino } = await requisitar<{ destino: string }>("/api/sessao/cadastro", {
        metodo: "POST",
        corpo: { userName: v.userName.trim(), email: v.email.trim(), password: v.password, phoneNumber: v.phoneNumber },
      });
      window.location.assign(destino);
    } catch (erro) {
      if (!aplicarErrosServidor(form, erro)) setErroGeral(mensagemDoErro(erro));
    }
  };

  return (
    <form className={classes.cartao} style={{ maxWidth: 520 }} onSubmit={enviar(criar)} noValidate>
      <Stack gap={6}>
        <Title order={1} fz={26} style={{ letterSpacing: "-0.01em" }}>
          Crie sua conta
        </Title>
        <Text fz={15} c="dimmed">
          Depois você escolhe se é uma startup ou um investidor.
        </Text>
      </Stack>

      {erroGeral && (
        <Alert role="alert" variant="light" color="red" icon={<IconAlertCircle size={18} />} p="sm">
          <Text fz={14} fw={600}>
            {erroGeral}
          </Text>
        </Alert>
      )}

      <TextInput
        label="Nome de usuário"
        withAsterisk
        leftSection={<Text fz={15} c="dimmed">@</Text>}
        leftSectionWidth={30}
        autoComplete="username"
        inputWrapperOrder={["label", "input", "description", "error"]}
        {...form.getInputProps("userName")}
        // A ajuda some quando há erro, como no canvas.
        {...(!form.errors.userName && { description: "Até 20 caracteres: letras, números e - . _ @ +" })}
      />

      <TextInput
        label="E-mail"
        withAsterisk
        type="email"
        autoComplete="email"
        {...form.getInputProps("email")}
      />

      <Stack gap={8}>
        <PasswordInput
          label="Senha"
          withAsterisk
          autoComplete="new-password"
          visibilityToggleButtonProps={{ "aria-label": "Mostrar senha" }}
          aria-describedby="requisitos-senha"
          {...form.getInputProps("password")}
        />
        <RequisitosSenha senha={form.values.password} id="requisitos-senha" />
      </Stack>

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
        placeholder="16999990000"
        autoComplete="tel"
        inputWrapperOrder={["label", "input", "description", "error"]}
        {...form.getInputProps("phoneNumber")}
        {...(!form.errors.phoneNumber && { description: "Somente números, até 20 dígitos." })}
      />

      <Button type="submit" h={44} size="md" loading={form.submitting}>
        Continuar
      </Button>
      <Text fz={12} c="dimmed" ta="center">
        Ao continuar, criamos sua conta e você já entra automaticamente.
      </Text>
    </form>
  );
}
