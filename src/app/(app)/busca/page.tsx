import { Suspense } from "react";
import { TelaBusca } from "./TelaBusca";

export const metadata = { title: "Buscar · InStartups" };

export default function PaginaBusca() {
  return (
    <Suspense>
      <TelaBusca />
    </Suspense>
  );
}
