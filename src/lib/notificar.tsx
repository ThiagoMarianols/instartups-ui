"use client";

// Toasts (@mantine/notifications) no padrão do artboard "Feedback · Notificações e alertas".
import { notifications } from "@mantine/notifications";
import { IconCheck, IconClockHour4, IconInfoCircle, IconLock, IconX } from "@tabler/icons-react";
import { ErroApi, MENSAGENS_STATUS, mensagemDoErro } from "@/lib/api/erros";

export function notificarSucesso(mensagem: string) {
  notifications.show({ message: mensagem, color: "green", icon: <IconCheck size={16} stroke={2.5} />, autoClose: 4000 });
}

export function notificarInfo(mensagem: string) {
  notifications.show({ message: mensagem, color: "dark.7", icon: <IconInfoCircle size={16} />, autoClose: 4000 });
}

export function notificarErro(erro: unknown) {
  const mensagem = mensagemDoErro(erro);
  const status = erro instanceof ErroApi ? erro.status : 0;
  if (erro instanceof ErroApi && erro.sessaoExpirada) return; // o cliente já redireciona ao login
  const icon =
    status === 429 ? (
      <IconClockHour4 size={16} />
    ) : mensagem === MENSAGENS_STATUS.sessaoExpirada ? (
      <IconLock size={16} />
    ) : status === 409 ? (
      <IconInfoCircle size={16} />
    ) : (
      <IconX size={16} stroke={2.5} />
    );
  const color = status === 429 || status === 409 ? "dark.7" : "red";
  notifications.show({ message: mensagem, color, icon, autoClose: 5000 });
}
