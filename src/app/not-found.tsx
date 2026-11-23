import type { Metadata } from "next";
import { IconSearchOff } from "@tabler/icons-react";
import { TelaStatus } from "@/components/comum/TelaStatus";

export const metadata: Metadata = {
  title: "Página não encontrada · InStartups",
};

export default function PaginaNaoEncontrada() {
  return (
    <TelaStatus
      icone={<IconSearchOff size={28} stroke={1.75} />}
      codigo="404"
      titulo="Página não encontrada"
      texto="O endereço que você tentou acessar não existe ou foi movido."
      links={[
        { href: "/feed", rotulo: "Ir para o feed", variante: "filled" },
        { href: "/busca", rotulo: "Buscar perfis", variante: "default" },
      ]}
    />
  );
}
