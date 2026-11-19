"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Skeleton, Stack } from "@mantine/core";
import { IconUserOff } from "@tabler/icons-react";
import { ErroApi, mensagemDoErro } from "@/lib/api/erros";
import { usePerfilPublico, useSeguir } from "@/hooks/dados";
import { useSessao } from "@/components/app/Sessao";
import { EstadoVazio } from "@/components/comum/EstadoVazio";
import { CabecalhoPerfil, SobrePerfil } from "@/components/perfil/CabecalhoPerfil";
import { AbaPostagens } from "@/components/perfil/AbaPostagens";
import { BotaoSeguir } from "@/components/perfil/BotaoSeguir";
import app from "@/components/app/app.module.css";

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Perfil de visitante (artboards 08 e 09). Seguir usa o id do PERFIL. */
export function TelaPerfilPublico({ id }: { id: string }) {
  const router = useRouter();
  const { perfil: eu } = useSessao();
  const valido = GUID.test(id);
  const meu = id === eu.id;
  const consulta = usePerfilPublico(id, valido && !meu);
  const seguir = useSeguir();

  useEffect(() => {
    if (meu) router.replace("/perfil/me");
  }, [meu, router]);

  if (meu) return null;

  const naoEncontrado = !valido || (consulta.error instanceof ErroApi && consulta.error.status === 404);

  return (
    <div className={app.pagina}>
      <main className={app.principal} style={{ maxWidth: 760 }}>
        {naoEncontrado ? (
          <EstadoVazio
            icone={<IconUserOff size={26} stroke={1.75} />}
            titulo="Perfil não encontrado"
            texto="O perfil pode ter sido desativado ou o endereço está incorreto."
            acao={
              <Button component={Link} href="/busca" variant="default">
                Buscar perfis
              </Button>
            }
          />
        ) : consulta.isError ? (
          <EstadoVazio
            icone={<IconUserOff size={26} stroke={1.75} />}
            titulo="Não foi possível carregar o perfil."
            texto={mensagemDoErro(consulta.error)}
            acao={
              <Button variant="default" onClick={() => consulta.refetch()}>
                Tentar novamente
              </Button>
            }
          />
        ) : !consulta.data ? (
          <Stack gap={16} aria-busy="true">
            <Skeleton height={320} radius="md" />
            <Skeleton height={160} radius="md" />
          </Stack>
        ) : (
          <>
            <CabecalhoPerfil
              perfil={consulta.data}
              acao={
                <BotaoSeguir
                  seguindo={consulta.data.seguindoPorMim}
                  nome={consulta.data.nome}
                  desabilitado={!eu.ativo || seguir.isPending}
                  motivo={!eu.ativo ? "Perfil desativado: reative para seguir." : undefined}
                  onAlternar={(s) => seguir.mutate({ perfilId: id, seguir: s })}
                />
              }
            />
            <SobrePerfil perfil={consulta.data} />
            <AbaPostagens perfilId={id} proprio={false} />
          </>
        )}
      </main>
    </div>
  );
}
