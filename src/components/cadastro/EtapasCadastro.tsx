import { IconCheck } from "@tabler/icons-react";
import classes from "./cadastro.module.css";

const ETAPAS = ["Conta", "Tipo de perfil", "Perfil"];

export function EtapasCadastro({ ativa }: { ativa: 1 | 2 | 3 }) {
  return (
    <ol aria-label="Etapas do cadastro" className={classes.etapas}>
      {ETAPAS.map((rotulo, i) => {
        const n = i + 1;
        const estado = n < ativa ? "feita" : n === ativa ? "atual" : "pendente";
        return (
          <li key={rotulo} className={classes.etapa} data-ultima={n === ETAPAS.length || undefined}>
            <span className={classes.circulo} data-estado={estado} aria-current={estado === "atual" ? "step" : undefined}>
              {estado === "feita" ? <IconCheck size={16} stroke={3} aria-label="Concluída" /> : n}
            </span>
            <span className={classes.rotulo}>
              <span className={classes.passo}>Passo {n}</span>
              <span className={classes.nome}>{rotulo}</span>
            </span>
            {n < ETAPAS.length && <span className={classes.linha} data-feita={estado === "feita" || undefined} />}
          </li>
        );
      })}
    </ol>
  );
}
