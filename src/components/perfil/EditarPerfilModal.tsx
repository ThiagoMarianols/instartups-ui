"use client";

import { useState } from "react";
import { Alert, Button, Divider, Group, Modal, Stack, Text } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import type { MeuPerfil } from "@/lib/api/tipos";
import { api } from "@/lib/api/cliente";
import { mensagemDoErro } from "@/lib/api/erros";
import {
  contarErros,
  paraDtoInvestidor,
  paraDtoStartup,
  validarPerfil,
  valoresDoPerfil,
  type ValoresPerfil,
} from "@/lib/validacao/perfil-form";
import { aplicarErrosServidor, useFormulario } from "@/hooks/useFormulario";
import { chaves } from "@/hooks/dados";
import { notificarSucesso } from "@/lib/notificar";
import { PerfilForm } from "./PerfilForm";

/** Modal "Editar perfil" (artboard 11). PUT /perfil/startup|investidor com TODOS os campos. */
export function EditarPerfilModal({ perfil, aberto, onFechar }: { perfil: MeuPerfil; aberto: boolean; onFechar: () => void }) {
  return (
    <Modal
      opened={aberto}
      onClose={onFechar}
      size={720}
      padding={0}
      closeButtonProps={{ "aria-label": "Fechar" }}
      title={
        <Stack gap={2}>
          <span>Editar perfil</span>
          <Text component="span" fz={13} fw={400} c="dimmed">
            Todos os campos são enviados de novo ao salvar.
          </Text>
        </Stack>
      }
      styles={{ header: { padding: "18px 24px", borderBottom: "1px solid var(--mantine-color-default-border)", alignItems: "flex-start" } }}
    >
      {aberto && <Conteudo perfil={perfil} onFechar={onFechar} />}
    </Modal>
  );
}

function Conteudo({ perfil, onFechar }: { perfil: MeuPerfil; onFechar: () => void }) {
  const qc = useQueryClient();
  const tipo = perfil.tipo === "STARTUP" ? "startup" : "investidor";
  const [enviando, setEnviando] = useState({ foto: false, capa: false });
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const { form, enviar } = useFormulario<ValoresPerfil>({
    initialValues: valoresDoPerfil(perfil),
    validate: (v) => validarPerfil(tipo, v),
  });

  const salvar = async (v: ValoresPerfil) => {
    setErroGeral(null);
    try {
      await api("command", `perfil/${tipo}`, {
        metodo: "PUT",
        corpo: tipo === "startup" ? paraDtoStartup(v) : paraDtoInvestidor(v),
      });
      notificarSucesso("Perfil atualizado.");
      await qc.invalidateQueries({ queryKey: chaves.meuPerfil });
      qc.invalidateQueries({ queryKey: chaves.postagens });
      onFechar();
    } catch (erro) {
      if (!aplicarErrosServidor(form, erro)) setErroGeral(mensagemDoErro(erro));
    }
  };

  const nErros = contarErros(form.errors);
  const ocupado = enviando.foto || enviando.capa;

  return (
    <form onSubmit={enviar(salvar)} noValidate>
      <Stack gap={20} p={24}>
        {(erroGeral || nErros > 0) && (
          <Alert role="alert" variant="light" color="red" icon={<IconAlertCircle size={18} />} p="sm">
            <Text fz={14} fw={700} c="var(--app-err-text)">
              {erroGeral ?? "Erro de validação."}
            </Text>
            {!erroGeral && (
              <Text fz={13}>{nErros === 1 ? "Revise o campo destacado abaixo." : `Revise os ${nErros} campos destacados abaixo.`}</Text>
            )}
          </Alert>
        )}
        <PerfilForm form={form} tipo={tipo} onEnviandoChange={(chave, e) => setEnviando((s) => ({ ...s, [chave]: e }))} />
      </Stack>
      <Divider />
      <Group justify="flex-end" gap={8} px={24} py={16}>
        <Button variant="default" onClick={onFechar}>
          Cancelar
        </Button>
        <Button type="submit" loading={form.submitting} disabled={ocupado}>
          Salvar alterações
        </Button>
      </Group>
    </form>
  );
}
