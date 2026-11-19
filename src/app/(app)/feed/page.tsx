import { Suspense } from "react";
import { TelaFeed } from "./TelaFeed";

export const metadata = { title: "Feed · InStartups" };

export default function PaginaFeed() {
  return (
    <Suspense>
      <TelaFeed />
    </Suspense>
  );
}
