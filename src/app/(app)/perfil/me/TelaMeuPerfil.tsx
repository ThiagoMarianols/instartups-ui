"use client";

import { Button, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPencil } from "@tabler/icons-react";
import { useSessao } from "@/components/app/Sessao";
import { CabecalhoPerfil, SobrePerfil } from "@/components/perfil/CabecalhoPerfil";
import { AbaPostagens } from "@/components/perfil/AbaPostagens";
import { AlertaPerfilDesativado } from "@/components/perfil/AlertaPerfilDesativado";
import { EditarPerfilModal } from "@/components/perfil/EditarPerfilModal";
import app from "@/components/app/app.module.css";

/** Meu perfil (artboard 10) e perfil desativado (artboard 14). */
export function TelaMeuPerfil() {
  const { perfil } = useSessao();
  const [editando, edicao] = useDisclosure(false);

  const botaoEditar = (
    <Button
      variant="default"
      h={38}
      leftSection={<IconPencil size={16} stroke={1.75} />}
      onClick={edicao.open}
      disabled={!perfil.ativo}
    >
      Editar perfil
    </Button>
  );

  return (
    <div className={app.pagina}>
      <main className={app.principal} style={{ maxWidth: 760 }}>
        {!perfil.ativo && <AlertaPerfilDesativado />}
        <CabecalhoPerfil
          perfil={perfil}
          acao={
            perfil.ativo ? (
              botaoEditar
            ) : (
              <Tooltip label="Reative o perfil para editar.">
                <span>{botaoEditar}</span>
              </Tooltip>
            )
          }
        />
        <SobrePerfil perfil={perfil} />
        <AbaPostagens perfilId={perfil.id} proprio />
      </main>
      <EditarPerfilModal perfil={perfil} aberto={editando} onFechar={edicao.close} />
    </div>
  );
}
