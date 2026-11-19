"use client";

import { useEffect, useState } from "react";
import { Title } from "@mantine/core";
import { useSessao } from "@/components/app/Sessao";
import { SecaoAparencia, SecaoConta, SecaoLocalizacao, SecaoPerfil, SecaoSenha, SecaoSessoes } from "./Secoes";
import app from "@/components/app/app.module.css";
import classes from "./configuracoes.module.css";

const SECOES = [
  { id: "cfg-conta", rotulo: "Conta" },
  { id: "cfg-senha", rotulo: "Senha" },
  { id: "cfg-sessoes", rotulo: "Sessões" },
  { id: "cfg-local", rotulo: "Localização" },
  { id: "cfg-perfil", rotulo: "Perfil" },
  { id: "cfg-aparencia", rotulo: "Aparência" },
];

/** Configurações (artboard 13). */
export function TelaConfiguracoes() {
  const { perfil } = useSessao();
  const [ativa, setAtiva] = useState("cfg-conta");

  // Destaca a seção visível no menu lateral.
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entradas) => {
        const visivel = entradas.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visivel) setAtiva(visivel.target.id);
      },
      { rootMargin: "0px 0px -60% 0px" },
    );
    SECOES.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  return (
    <div className={app.pagina}>
      <main className={app.principal} style={{ maxWidth: 960, gap: 24 }}>
        <Title order={1} fz={26} style={{ letterSpacing: "-0.01em" }}>
          Configurações
        </Title>
        <div className={classes.grade}>
          <nav aria-label="Seções" className={classes.secoes}>
            {SECOES.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={classes.secaoLink}
                data-ativo={ativa === s.id || undefined}
                aria-current={ativa === s.id ? "true" : undefined}
              >
                {s.rotulo}
              </a>
            ))}
          </nav>
          <div className={classes.conteudo}>
            <SecaoConta />
            <SecaoSenha />
            <SecaoSessoes />
            <SecaoLocalizacao perfil={perfil} />
            <SecaoPerfil perfil={perfil} />
            <SecaoAparencia />
          </div>
        </div>
      </main>
    </div>
  );
}
