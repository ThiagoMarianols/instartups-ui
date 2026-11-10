"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Anchor, Button, CloseButton, Group, Loader, Skeleton, Stack, Text, TextInput, Title } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconMail, IconSearch, IconSearchOff } from "@tabler/icons-react";
import type { FiltroTipo, PerfilBusca } from "@/lib/api/tipos";
import { rotuloSetor } from "@/lib/api/tipos";
import { mensagemDoErro } from "@/lib/api/erros";
import { formatarKm } from "@/lib/formato/moeda";
import { BUSCA_MAX, realcar, termoParaBusca } from "@/lib/validacao/busca";
import { chaves, itensDe, useListaPaginada, useSeguir } from "@/hooks/dados";
import { useSessao } from "@/components/app/Sessao";
import { Abas } from "@/components/comum/Abas";
import { AvatarPerfil } from "@/components/comum/AvatarPerfil";
import { BadgeTipo } from "@/components/comum/Badges";
import { EstadoVazio } from "@/components/comum/EstadoVazio";
import { BotaoSeguir } from "@/components/perfil/BotaoSeguir";
import app from "@/components/app/app.module.css";
import classes from "./busca.module.css";

const ABAS: { valor: FiltroTipo; rotulo: string }[] = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "startup", rotulo: "Startups" },
  { valor: "investidor", rotulo: "Investidores" },
];

function Realce({ texto, termo, ativo, forte = 800 }: { texto: string; termo: string; ativo: boolean; forte?: number }) {
  if (!ativo) return <>{texto}</>;
  const [antes, meio, depois] = realcar(texto, termo);
  return (
    <>
      {antes}
      {meio && <strong style={{ fontWeight: forte }}>{meio}</strong>}
      {depois}
    </>
  );
}

/** Busca de perfis (Q7 GET /busca?termo=&tipo=). Perfis desativados não aparecem; e-mail nunca é exibido. */
export function TelaBusca() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { perfil: eu } = useSessao();
  const seguir = useSeguir();

  const [consulta, setConsulta] = useState(params.get("q") ?? "");
  const tipoParam = params.get("tipo");
  const tipo: FiltroTipo = tipoParam === "startup" || tipoParam === "investidor" ? tipoParam : "todos";
  const [debounced] = useDebouncedValue(consulta, 300);
  const termo = termoParaBusca(debounced);
  const entrada = useRef<HTMLInputElement>(null);

  // Mantém ?q= e ?tipo= na URL para voltar à mesma busca.
  useEffect(() => {
    const p = new URLSearchParams();
    if (debounced.trim()) p.set("q", debounced.trim());
    if (tipo !== "todos") p.set("tipo", tipo);
    const s = p.toString();
    router.replace(`${pathname}${s ? `?${s}` : ""}`, { scroll: false });
  }, [debounced, tipo, pathname, router]);

  const lista = useListaPaginada<PerfilBusca>(
    [...chaves.busca, termo, tipo],
    "busca",
    { termo: termo ?? undefined, tipo },
    termo !== null,
  );
  const resultados = itensDe(lista.data);
  const bruto = consulta.trim();
  const curto = bruto.length > 0 && termoParaBusca(consulta) === null;
  const pareceEmail = (termo ?? "").includes("@");

  const limpar = () => {
    setConsulta("");
    entrada.current?.focus();
  };

  const n = resultados.length;
  const contagem = termo && !lista.isPending ? `${n}${lista.hasNextPage ? "+" : ""}` : "";

  return (
    <div className={app.pagina}>
      <main className={app.principal} style={{ maxWidth: 760 }}>
        <Title order={1} fz={22}>
          Buscar
        </Title>

        <TextInput
          ref={entrada}
          type="search"
          aria-label="Buscar perfis"
          placeholder="Buscar por nome, @usuário ou e-mail"
          maxLength={BUSCA_MAX}
          size="lg"
          radius={10}
          autoComplete="off"
          value={consulta}
          onChange={(e) => setConsulta(e.currentTarget.value)}
          leftSection={<IconSearch size={20} stroke={1.75} />}
          rightSection={
            bruto ? <CloseButton radius="xl" size={32} aria-label="Limpar busca" onClick={limpar} variant="light" color="gray" /> : null
          }
          rightSectionWidth={48}
          styles={{ input: { fontSize: 16, height: 48, borderColor: bruto ? "var(--mantine-primary-color-filled)" : undefined } }}
          autoFocus
        />

        <div className={classes.abas}>
          <Abas
            rotulo="Tipo de perfil"
            valor={tipo}
            onChange={(t) => {
              const p = new URLSearchParams(params.toString());
              if (t === "todos") p.delete("tipo");
              else p.set("tipo", t);
              router.replace(`${pathname}?${p.toString()}`, { scroll: false });
            }}
            abas={ABAS.map((a) => ({
              valor: a.valor,
              rotulo: (
                <>
                  {a.rotulo}{" "}
                  {a.valor === tipo && contagem && (
                    <Text component="span" fz={15} fw={500} c="dimmed">
                      {contagem}
                    </Text>
                  )}
                </>
              ),
            }))}
          />
        </div>

        {!bruto && (
          <EstadoVazio
            solido
            icone={<IconSearch size={26} stroke={1.75} />}
            titulo="Busque startups e investidores"
            texto="Pelo nome do perfil, pelo @usuário ou pelo e-mail completo. Abra o perfil para ver as postagens e seguir."
          />
        )}

        {curto && (
          <Text fz={13} c="dimmed">
            Digite pelo menos 2 caracteres.
          </Text>
        )}

        {termo && lista.isPending && (
          <Stack gap={8} aria-busy="true">
            <Skeleton height={14} width={140} radius="xl" />
            <Skeleton height={240} radius="md" />
          </Stack>
        )}

        {termo && lista.isError && (
          <EstadoVazio
            icone={<IconSearchOff size={26} stroke={1.75} />}
            titulo="Não foi possível buscar agora."
            texto={mensagemDoErro(lista.error)}
            acao={
              <Button variant="default" onClick={() => lista.refetch()}>
                Tentar novamente
              </Button>
            }
          />
        )}

        {termo && lista.isSuccess && n === 0 && (
          <EstadoVazio
            icone={<IconSearchOff size={26} stroke={1.75} />}
            titulo={`Nenhum perfil encontrado para “${bruto}”`}
            texto="Confira a grafia, tente outra aba ou busque pelo e-mail completo."
            acao={
              <Button variant="default" onClick={limpar}>
                Limpar busca
              </Button>
            }
          />
        )}

        {termo && n > 0 && (
          <Stack gap={8}>
            <Text fz={13} c="dimmed">
              {n === 1 ? "1 perfil encontrado" : `${n}${lista.hasNextPage ? "+" : ""} perfis encontrados`}
            </Text>
            <div className={classes.lista}>
              {resultados.map((r) => {
                const href = r.ehMeu ? "/perfil/me" : `/perfil/${r.id}`;
                const realcarTexto = !pareceEmail && r.encontradoPor !== "email";
                const meta = [r.setor ? rotuloSetor(r.setor) : null, r.ehMeu ? null : formatarKm(r.distanciaKm)].filter(Boolean);
                return (
                  <article key={r.id} className={classes.item}>
                    <Anchor component={Link} href={href} aria-label={`Abrir perfil de ${r.nome}`} style={{ flex: "none" }}>
                      <AvatarPerfil nome={r.nome} tipo={r.tipo} src={r.imagemPerfilUrl} tamanho={48} />
                    </Anchor>
                    <Stack gap={3} style={{ flex: 1, minWidth: 0 }}>
                      <Group gap={8} wrap="wrap">
                        <Anchor component={Link} href={href} fz={16} c="var(--mantine-color-text)" underline="hover">
                          <Realce texto={r.nome} termo={termo} ativo={realcarTexto} />
                        </Anchor>
                        <BadgeTipo tipo={r.tipo} size="xs" />
                      </Group>
                      <Text fz={13} c="dimmed">
                        @
                        <Realce texto={r.usuario ?? ""} termo={termo} ativo={realcarTexto} forte={700} />
                        {meta.length > 0 ? ` · ${meta.join(" · ")}` : ""}
                      </Text>
                      {r.resumo && (
                        <Text fz={14} lh={1.5} truncate="end">
                          {r.resumo}
                        </Text>
                      )}
                      {r.encontradoPor === "email" && (
                        <span className={classes.etiqueta}>
                          <IconMail size={13} stroke={2} aria-hidden />
                          Encontrado pelo e-mail
                        </span>
                      )}
                    </Stack>
                    {r.ehMeu ? (
                      <span className={classes.voce}>Você</span>
                    ) : (
                      <BotaoSeguir
                        compacto
                        seguindo={r.seguindoPorMim}
                        nome={r.nome}
                        desabilitado={!eu.ativo || seguir.isPending}
                        motivo={!eu.ativo ? "Perfil desativado: reative para seguir." : undefined}
                        onAlternar={(s) => seguir.mutate({ perfilId: r.id, seguir: s })}
                      />
                    )}
                  </article>
                );
              })}
            </div>
            {lista.hasNextPage && (
              <Button variant="subtle" color="gray" onClick={() => lista.fetchNextPage()} loading={lista.isFetchingNextPage}>
                Carregar mais
              </Button>
            )}
            {lista.isFetching && !lista.isFetchingNextPage && <Loader size="xs" mx="auto" aria-label="Atualizando" />}
          </Stack>
        )}
      </main>
    </div>
  );
}
