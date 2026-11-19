import { CabecalhoCadastro } from "@/components/cadastro/CabecalhoCadastro";
import { EtapasCadastro } from "@/components/cadastro/EtapasCadastro";
import classes from "@/components/cadastro/cadastro.module.css";
import { FormularioConta } from "./FormularioConta";

export const metadata = { title: "Criar conta · InStartups" };

export default function PaginaCadastro() {
  return (
    <div className={classes.pagina}>
      <CabecalhoCadastro conectado={false} />
      <main className={classes.principal}>
        <EtapasCadastro ativa={1} />
        <FormularioConta />
      </main>
    </div>
  );
}
