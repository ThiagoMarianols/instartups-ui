import { TelaPerfilPublico } from "./TelaPerfilPublico";

export const metadata = { title: "Perfil · InStartups" };

export default async function PaginaPerfil({ params }: PageProps<"/perfil/[id]">) {
  const { id } = await params;
  return <TelaPerfilPublico id={id} />;
}
