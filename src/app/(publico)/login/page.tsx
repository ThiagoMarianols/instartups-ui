import { Suspense } from "react";
import Image from "next/image";
import { FormularioLogin } from "./FormularioLogin";
import classes from "./login.module.css";
import { Logo } from "@/components/Logo";

export const metadata = { title: "Entrar · InStartups" };

export default function PaginaLogin() {
  return (
    <div className={classes.pagina}>
      <aside className={classes.marca}>
        <Image
          src="/tela-login2.jpg"
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className={classes.imagemFundo}
        />
        <div className={classes.sobreposicao} aria-hidden="true" />

        <div className={classes.logoTopo}>
          <Logo tamanho="md" />
        </div>
        <div className={classes.chamada}>
          <h1 className={classes.titulo}>Startups e investidores no mesmo feed.</h1>
          <p className={classes.texto}>
            Publique novidades, siga perfis e encontre quem está perto de você ou no seu setor.
          </p>
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
