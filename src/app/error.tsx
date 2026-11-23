"use client";

import { useEffect } from "react";
import { IconAlertTriangle } from "@tabler/icons-react";
import { TelaStatus } from "@/components/comum/TelaStatus";

export default function ErroGlobal({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <TelaStatus
      icone={<IconAlertTriangle size={28} stroke={1.75} />}
      titulo="Algo deu errado"
      texto="Ocorreu um erro inesperado ao carregar esta página. Tente novamente ou volte para o início."
      onTentarNovamente={retry}
      links={[{ href: "/feed", rotulo: "Ir para o feed", variante: "default" }]}
    />
  );
}
