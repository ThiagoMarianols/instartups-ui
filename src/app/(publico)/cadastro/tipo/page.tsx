import { CabecalhoCadastro } from "@/components/cadastro/CabecalhoCadastro";
import { EtapasCadastro } from "@/components/cadastro/EtapasCadastro";
import classes from "@/components/cadastro/cadastro.module.css";
import { EscolhaTipo } from "./EscolhaTipo";

export const metadata = { title: "Tipo de perfil · InStartups" };

export default function PaginaTipoPerfil() {
  return (
    <div className={classes.pagina}>
      <CabecalhoCadastro conectado />
      <main className={classes.principal}>
        <EtapasCadastro ativa={2} />
        <EscolhaTipo />
      </main>
    </div>
  );
}
