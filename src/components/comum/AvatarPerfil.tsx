import { Avatar, type AvatarProps } from "@mantine/core";
import type { TipoPerfil } from "@/lib/api/tipos";
import { iniciais } from "@/lib/formato/texto";

interface Props extends Omit<AvatarProps, "src" | "children"> {
  nome: string;
  tipo?: TipoPerfil;
  src?: string | null;
  tamanho?: number;
}

/** Avatar com iniciais; investidor usa a cor alternada (escura no claro, clara no escuro). */
export function AvatarPerfil({ nome, tipo, src, tamanho = 42, ...resto }: Props) {
  const investidor = tipo === "INVESTIDOR";
  return (
    <Avatar
      src={src || null}
      alt={nome}
      size={tamanho}
      radius={1000}
      {...resto}
      styles={{
        placeholder: {
          background: investidor ? "var(--app-avatar-alt)" : "var(--app-avatar)",
          color: investidor ? "var(--app-avatar-alt-text)" : "var(--app-avatar-text)",
          fontWeight: 700,
          fontSize: Math.round(tamanho * 0.34),
        },
      }}
    >
      {iniciais(nome)}
    </Avatar>
  );
}
