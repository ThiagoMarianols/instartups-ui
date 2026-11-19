"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Badge, Button, Group, Stack, Text, Title } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { api, requisitar } from "@/lib/api/cliente";
import { ErroApi, mensagemDoErro } from "@/lib/api/erros";
import {
  contarErros,
  paraDtoInvestidor,
  paraDtoStartup,
  validarPerfil,
  valoresVazios,
  type TipoCadastro,
  type ValoresPerfil,
} from "@/lib/validacao/perfil-form";
import { aplicarErrosServidor, focarPrimeiroErro, useFormulario } from "@/hooks/useFormulario";
import { PerfilForm } from "@/components/perfil/PerfilForm";
import { notificarSucesso } from "@/lib/notificar";
import classes from "@/components/cadastro/cadastro.module.css";

const MSG_JA_TEM_PERFIL = "O usuário já possui um perfil cadastrado.";

export function FormularioCadastroPerfil() {
  const router = useRouter();
  const params = useSearchParams();
  const tipoParam = params.get("tipo");
  const tipo: TipoCadastro | null = tipoParam === "startup" || tipoParam === "investidor" ? tipoParam : null;

  useEffect(() => {
    if (!tipo) router.replace("/cadastro/tipo");
  }, [tipo, router]);

  const [enviando, setEnviando] = useState({ foto: false, capa: false });
  const [alerta, setAlerta] = useState<{ titulo: string; texto?: string; jaTemPerfil?: boolean } | null>(null);

  const { form, enviar } = useFormulario<ValoresPerfil>({
    initialValues: valoresVazios(),
    validate: (v) => validarPerfil(tipo ?? "startup", v),
  });

  const nErros = contarErros(form.errors);

  const irParaFeed = async () => {
    await requisitar("/api/sessao/perfil", { metodo: "POST", corpo: { temPerfil: true } });
    router.replace("/feed");
    router.refresh();
  };

  const concluir = async (v: ValoresPerfil) => {
    if (!tipo) return;
    setAlerta(null);
    try {
      if (tipo === "startup") await api("command", "perfil/startup", { metodo: "POST", corpo: paraDtoStartup(v) });
      else await api("command", "perfil/investidor", { metodo: "POST", corpo: paraDtoInvestidor(v) });
      notificarSucesso("Perfil cadastrado com sucesso.");
      await irParaFeed();
    } catch (erro) {
      if (aplicarErrosServidor(form, erro)) return;
      if (erro instanceof ErroApi && erro.status === 409 && erro.message === MSG_JA_TEM_PERFIL) {
        setAlerta({
          titulo: MSG_JA_TEM_PERFIL,
          texto: "Cada usuário tem um único perfil. Vá para o feed ou reative seu perfil em Configurações.",
          jaTemPerfil: true,
        });
      } else {
        setAlerta({ titulo: mensagemDoErro(erro) });
      }
      focarPrimeiroErro();
    }
  };

  if (!tipo) return null;
  const S = tipo === "startup";
  const ocupado = enviando.foto || enviando.capa;

  return (
    <form className={classes.cartao} style={{ maxWidth: 720, gap: 24 }} onSubmit={enviar(concluir)} noValidate>
      <Group justify="space-between" align="flex-start" gap={16} wrap="wrap">
        <Stack gap={6}>
          <Title order={1} fz={26} style={{ letterSpacing: "-0.01em" }}>
            {S ? "Perfil da startup" : "Perfil do investidor"}
          </Title>
          <Text fz={15} c="dimmed">
            {S
              ? "Essas informações aparecem no seu perfil público."
              : "Sua tese e sua faixa de ticket aparecem no seu perfil público."}
          </Text>
        </Stack>
        <Badge variant={S ? "light" : "outline"} color="gray" c="var(--app-badge-text)" size="md">
          {S ? "STARTUP" : "INVESTIDOR"}
        </Badge>
      </Group>

      {nErros > 0 && !alerta && (
        <Alert role="alert" variant="light" color="red" icon={<IconAlertCircle size={18} />} p="sm">
          <Text fz={14} fw={700} c="var(--app-err-text)">
            Erro de validação.
          </Text>
          <Text fz={13}>
            {nErros === 1 ? "Revise o campo destacado abaixo." : `Revise os ${nErros} campos destacados abaixo.`}
          </Text>
        </Alert>
      )}

      {alerta && (
        <Alert role="alert" variant="light" color="red" icon={<IconAlertCircle size={18} />} p="sm">
          <Text fz={14} fw={700} c="var(--app-err-text)">
            {alerta.titulo}
          </Text>
          {alerta.texto && <Text fz={13}>{alerta.texto}</Text>}
          {alerta.jaTemPerfil && (
            <Button size="compact-sm" mt={8} onClick={irParaFeed}>
              Ir para o feed
            </Button>
          )}
        </Alert>
      )}

      <PerfilForm form={form} tipo={tipo} onEnviandoChange={(chave, e) => setEnviando((s) => ({ ...s, [chave]: e }))} />

      <Group justify="space-between" gap={12} pt={20} style={{ borderTop: "1px solid var(--mantine-color-default-border)" }}>
        <Button component={Link} href="/cadastro/tipo" variant="default" h={42}>
          Voltar
        </Button>
        <Button type="submit" h={42} px={22} loading={form.submitting} disabled={ocupado}>
          Concluir cadastro
        </Button>
      </Group>
      {ocupado && (
        <Text fz={12} c="dimmed" ta="right" mt={-12}>
          Aguarde o envio da imagem terminar.
        </Text>
      )}
    </form>
  );
}
