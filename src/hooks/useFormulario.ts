"use client";

import { useRef } from "react";
import { useForm, type UseFormInput, type UseFormReturnType } from "@mantine/form";
import { ErroApi } from "@/lib/api/erros";

/** Rola até o primeiro campo inválido e o foca. */
export function focarPrimeiroErro() {
  window.setTimeout(() => {
    const alvo = document.querySelector<HTMLElement>('[aria-invalid="true"], [data-erro="true"]');
    if (!alvo) return;
    alvo.scrollIntoView({ behavior: "smooth", block: "center" });
    if (typeof alvo.focus === "function") alvo.focus({ preventScroll: true });
  }, 0);
}

/**
 * useForm com o comportamento padrão do app:
 *  - valida no blur e no envio;
 *  - depois da primeira tentativa de envio, revalida a cada mudança;
 *  - foca o primeiro erro quando o envio falha.
 */
export function useFormulario<V extends Record<string, unknown>>(opcoes: UseFormInput<V>) {
  const tentou = useRef(false);
  const form: UseFormReturnType<V> = useForm<V>({
    mode: "controlled",
    validateInputOnBlur: true,
    ...opcoes,
    onValuesChange: (valores, anteriores) => {
      opcoes.onValuesChange?.(valores, anteriores);
      if (tentou.current) form.validate();
    },
  });

  const enviar =
    (handler: (valores: V) => void | Promise<void>) =>
    (evento?: React.FormEvent<HTMLFormElement>) => {
      tentou.current = true;
      return form.onSubmit(
        (valores) => handler(valores),
        () => focarPrimeiroErro(),
      )(evento);
    };

  return { form, enviar };
}

/**
 * Aplica os erros de campo vindos da API no formulário.
 * Devolve true se algum campo do formulário recebeu erro.
 */
export function aplicarErrosServidor<V>(
  form: UseFormReturnType<V>,
  erro: unknown,
  apelidos: Record<string, string> = {},
): boolean {
  if (!(erro instanceof ErroApi) || !erro.temCampos) return false;
  const erros: Record<string, string> = {};
  for (const [campo, mensagem] of Object.entries(erro.campos)) erros[apelidos[campo] ?? campo] = mensagem;
  form.setErrors(erros);
  focarPrimeiroErro();
  return true;
}
