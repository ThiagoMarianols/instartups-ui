"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button, CloseButton, Group, Text, Title } from "@mantine/core";
import { IconAdjustmentsHorizontal, IconNews } from "@tabler/icons-react";
import type { CodigoSetor, FiltroTipo, Postagem } from "@/lib/api/tipos";
import { rotuloSetor } from "@/lib/api/tipos";
import { chaves, useListaPaginada } from "@/hooks/dados";
import { FILTROS_PADRAO, contarFiltros, filtrosParaUrl, lerFiltros, paramsDoFeed, type FiltrosFeed } from "@/lib/filtros-feed";
import { formatarNumero } from "@/lib/formato/moeda";
import { useSessao } from "@/components/app/Sessao";
import { Abas } from "@/components/comum/Abas";
import { EstadoVazio } from "@/components/comum/EstadoVazio";
import { PainelFiltros } from "@/components/feed/PainelFiltros";
import { ResumoPerfil } from "@/components/feed/ResumoPerfil";
import { Compositor } from "@/components/postagem/Compositor";
import { ListaPostagens } from "@/components/postagem/ListaPostagens";
import app from "@/components/app/app.module.css";
import classes from "@/components/feed/feed.module.css";

const ABAS: { valor: FiltroTipo; rotulo: string }[] = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "startup", rotulo: "Startups" },
  { valor: "investidor", rotulo: "Investidores" },
];

/** Feed (artboards 07, 07b, 07c). Filtros guardados na URL. */
export function TelaFeed() {
  const { perfil } = useSessao();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const filtros = useMemo(() => lerFiltros(new URLSearchParams(params.toString())), [params]);

  const aplicar = (f: FiltrosFeed) => router.replace(`${pathname}${filtrosParaUrl(f)}`, { scroll: false });

  const consultaParams = paramsDoFeed(filtros);
  const consulta = useListaPaginada<Postagem>(chaves.feed(consultaParams), "feed", consultaParams);

  const pills: { rotulo: string; aria: string; remover: () => void }[] = [];
  if (filtros.raio !== null) {
    pills.push({
      rotulo: `Até ${formatarNumero(filtros.raio)} km`,
      aria: "Remover filtro de distância",
      remover: () => aplicar({ ...filtros, raio: null }),
    });
  }
  if (filtros.tipo === "startup") {
    filtros.setores.forEach((s: CodigoSetor) =>
      pills.push({
        rotulo: rotuloSetor(s),
        aria: `Remover setor ${rotuloSetor(s)}`,
        remover: () => aplicar({ ...filtros, setores: filtros.setores.filter((x) => x !== s) }),
      }),
    );
  }
  const temFiltros = contarFiltros(filtros) > 0 || filtros.tipo !== "todos";

  return (
    <div className={app.pagina}>
      <main className={app.principal} style={{ maxWidth: 640, paddingTop: 0 }}>
        <div className={classes.cabecalho} style={{ paddingTop: 24 }}>
          <Title order={1} fz={22}>
            Feed
          </Title>
          <div className={classes.barraAbas}>
            <Abas rotulo="Tipo de perfil" abas={ABAS} valor={filtros.tipo} onChange={(tipo) => aplicar({ ...filtros, tipo })} />
            <PainelFiltros filtros={filtros} onAplicar={aplicar} />
          </div>

          {pills.length > 0 && (
            <Group gap={8} wrap="wrap">
              <Text fz={13} c="dimmed">
                Filtrando por
              </Text>
              {pills.map((p) => (
                <Group
                  key={p.rotulo}
                  gap={4}
                  wrap="nowrap"
                  h={28}
                  pl={12}
                  pr={4}
                  style={{ borderRadius: 1000, background: "var(--app-soft)" }}
                >
                  <Text fz={13} fw={500}>
                    {p.rotulo}
                  </Text>
                  <CloseButton size={22} radius="xl" aria-label={p.aria} onClick={p.remover} />
                </Group>
              ))}
            </Group>
          )}
        </div>

        <Compositor perfil={perfil} />

        <ListaPostagens
          consulta={consulta}
          vazio={
            temFiltros ? (
              <EstadoVazio
                icone={<IconAdjustmentsHorizontal size={26} stroke={1.75} />}
                titulo="Nenhuma postagem encontrada com esses filtros"
                texto="Tente aumentar a distância ou escolher outros setores."
                acao={
                  <Button variant="default" onClick={() => aplicar(FILTROS_PADRAO)}>
                    Limpar filtros
                  </Button>
                }
              />
            ) : (
              <EstadoVazio
                icone={<IconNews size={26} stroke={1.75} />}
                titulo="Ainda não há postagens"
                texto="Publique uma novidade ou siga perfis para movimentar o feed."
              />
            )
          }
        />
      </main>
      <div className={app.lateral}>
        <ResumoPerfil raio={filtros.raio} />
      </div>
    </div>
  );
}
