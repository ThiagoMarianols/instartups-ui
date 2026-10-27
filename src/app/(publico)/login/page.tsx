import { Suspense } from "react";
import { FormularioLogin } from "./FormularioLogin";
import classes from "./login.module.css";
import { Logo } from "@/components/Logo";
import { IconBriefcase, IconRocket } from "@tabler/icons-react";

export const metadata = { title: "Entrar · InStartups" };

export default function PaginaLogin() {
  return (
    <div className={classes.pagina}>
      <aside className={classes.marca}>
        <Logo tamanho="md" />
        <div className={classes.chamada}>
          <h1 className={classes.titulo}>Startups e investidores no mesmo feed.</h1>
          <p className={classes.texto}>
            Publique novidades, siga perfis e encontre quem está perto de você ou no seu setor.
          </p>
        </div>
        <div className={classes.etiquetas}>
          <span className={classes.etiqueta}>
            <IconRocket size={16} stroke={1.75} aria-hidden />
            Startups
          </span>
          <span className={classes.etiqueta}>
            <IconBriefcase size={16} stroke={1.75} aria-hidden />
            Investidores
          </span>
        </div>
      </aside>

      <main className={classes.principal}>
        <Suspense>
          <FormularioLogin />
        </Suspense>
      </main>
    </div>
  );
}
