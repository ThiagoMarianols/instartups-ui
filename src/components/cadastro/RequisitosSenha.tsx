import { IconCheck, IconPointFilled, IconX } from "@tabler/icons-react";
import { requisitosSenha } from "@/lib/validacao/conta";
import classes from "./cadastro.module.css";

/** Barra de 5 segmentos + checklist das regras de senha da auth (artboard 02). */
export function RequisitosSenha({ senha, id }: { senha: string; id?: string }) {
  const requisitos = requisitosSenha(senha);
  const vazio = senha.length === 0;
  return (
    <>
      <div className={classes.barras} aria-hidden="true">
        {requisitos.map((r) => (
          <span key={r.rotulo} className={classes.barra} data-ok={r.ok || undefined} />
        ))}
      </div>
      <ul className={classes.requisitos} id={id} aria-label="Requisitos da senha">
        {requisitos.map((r) => (
          <li
            key={r.rotulo}
            className={classes.requisito}
            data-ok={r.ok || undefined}
            style={vazio ? { color: "var(--mantine-color-dimmed)" } : undefined}
          >
            {vazio ? (
              <IconPointFilled size={14} aria-hidden />
            ) : r.ok ? (
              <IconCheck size={14} stroke={2.5} aria-label="atendido" />
            ) : (
              <IconX size={14} stroke={2.5} aria-label="pendente" />
            )}
            {r.rotulo}
          </li>
        ))}
      </ul>
    </>
  );
}
