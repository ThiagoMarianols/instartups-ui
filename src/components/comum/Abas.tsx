"use client";

import type { ReactNode } from "react";
import classes from "@/components/feed/feed.module.css";

interface Aba<T extends string> {
  valor: T;
  rotulo: ReactNode;
}

/** Abas sublinhadas do canvas (Todos / Startups / Investidores), com setas do teclado. */
export function Abas<T extends string>({
  abas,
  valor,
  onChange,
  rotulo,
}: {
  abas: Aba<T>[];
  valor: T;
  onChange: (v: T) => void;
  rotulo: string;
}) {
  const mover = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const prox = abas[(i + (e.key === "ArrowRight" ? 1 : abas.length - 1)) % abas.length];
    onChange(prox.valor);
    const alvo = (e.currentTarget.parentElement?.children[abas.indexOf(prox)] as HTMLElement | undefined);
    alvo?.focus();
  };
  return (
    <div role="tablist" aria-label={rotulo} style={{ display: "flex", gap: 4 }}>
      {abas.map((a, i) => (
        <button
          key={a.valor}
          type="button"
          role="tab"
          aria-selected={a.valor === valor}
          tabIndex={a.valor === valor ? 0 : -1}
          className={classes.aba}
          onClick={() => onChange(a.valor)}
          onKeyDown={(e) => mover(e, i)}
        >
          {a.rotulo}
        </button>
      ))}
    </div>
  );
}
