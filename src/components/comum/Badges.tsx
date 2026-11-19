import { Badge, type BadgeProps } from "@mantine/core";
import type { TipoPerfil } from "@/lib/api/tipos";

/** STARTUP = light, INVESTIDOR = outline (diferem por preenchimento, não por cor). */
export function BadgeTipo({ tipo, ...resto }: { tipo: TipoPerfil } & BadgeProps) {
  const startup = tipo === "STARTUP";
  return (
    <Badge
      variant={startup ? "light" : "outline"}
      color="gray"
      size="sm"
      {...resto}
      styles={{
        root: {
          background: startup ? "var(--app-soft)" : "transparent",
          color: "var(--app-badge-text)",
          borderColor: startup ? undefined : "var(--app-badge-text)",
        },
      }}
    >
      {startup ? "STARTUP" : "INVESTIDOR"}
    </Badge>
  );
}

export function BadgeDesativada({ rotulo = "DESATIVADA", ...resto }: { rotulo?: string } & BadgeProps) {
  return (
    <Badge
      variant="light"
      color="red"
      size="sm"
      {...resto}
      styles={{ root: { background: "var(--app-err-bg)", color: "var(--app-err-text)" } }}
    >
      {rotulo}
    </Badge>
  );
}

export function BadgeAtivo(props: BadgeProps) {
  return (
    <Badge
      variant="light"
      color="green"
      size="sm"
      {...props}
      styles={{ root: { background: "var(--app-ok-bg)", color: "var(--app-ok)" } }}
    >
      ATIVO
    </Badge>
  );
}
