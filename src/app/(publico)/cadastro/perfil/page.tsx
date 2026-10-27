import { Suspense } from "react";
import { CabecalhoCadastro } from "@/components/cadastro/CabecalhoCadastro";
import { EtapasCadastro } from "@/components/cadastro/EtapasCadastro";
import classes from "@/components/cadastro/cadastro.module.css";
import { FormularioCadastroPerfil } from "./FormularioCadastroPerfil";

export const metadata = { title: "Cadastro do perfil · InStartups" };

export default function PaginaCadastroPerfil() {
  return (
    <div className={classes.pagina}>
      <CabecalhoCadastro conectado />
      <main className={classes.principal}>
        <EtapasCadastro ativa={3} />
        <Suspense>
          <FormularioCadastroPerfil />
        </Suspense>
      </main>
    </div>
  );
}
